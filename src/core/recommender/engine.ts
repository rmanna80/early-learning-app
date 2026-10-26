import { DOMAINS, LEVELS, type ActivityMeta, type DomainId, type Level } from '../content/types';
import type { ActivitySession, AgeBand } from '../progress/types';
import { describeNote, describeSuggestion, type NoteKind, type ReasonCode } from './reasons';
import { BALANCE_BONUS, DAY_MS, PRIORITY, RULES, SAME_DOMAIN_PENALTY } from './rules';

/**
 * The rule-based recommender.
 *
 * It answers one question: "which few activities should the child home
 * screen offer next, at which level, and why?" Everything it decides comes
 * with a reason code and a sentence a parent can read. It never locks
 * anything: the child can always pick any activity.
 *
 * It is a pure function. Same input, same output: no clock, no randomness,
 * no storage. The caller passes `now` and the session history; this makes
 * every rule easy to test.
 */

export interface Suggestion {
  activityId: string;
  level: Level;
  reason: ReasonCode;
  /** The other activity the reason refers to (the one built on, or the one that needed help). */
  relatedActivityId?: string;
  /** True when this activity's domain was explored least in the last week. */
  balancesDomains: boolean;
  /** How many past sessions of this activity the decision rests on (0 for a new activity). */
  basedOnSessions: number;
  parentText: string;
}

/** Things the dashboard should explain even though they aren't suggestions (e.g. a rested activity). */
export interface Note {
  activityId: string;
  kind: NoteKind;
  /** Epoch ms after which the activity can be suggested again. */
  until: number;
  parentText: string;
}

export interface RecommendInput {
  catalog: readonly ActivityMeta[];
  sessions: readonly ActivitySession[];
  ageBand: AgeBand;
  now: number;
  /** How many suggestions to return. Defaults to RULES.defaultCount. */
  count?: number;
}

export interface Recommendations {
  /** Best first. The child home screen highlights the first one. */
  suggestions: Suggestion[];
  notes: Note[];
}

/** The level every activity starts at, chosen from the parent's age band at onboarding. */
export function startLevel(ageBand: AgeBand): Level {
  return ageBand === 'under-3' ? 'easier' : 'standard';
}

export function recommend(input: RecommendInput): Recommendations {
  const { catalog, ageBand, now } = input;
  const count = input.count ?? RULES.defaultCount;

  // Oldest first, without mutating the caller's array.
  const sessions = [...input.sessions].sort((a, b) => a.startedAt - b.startedAt);
  const history = groupByActivity(sessions);
  const historyOf = (id: string) => history.get(id) ?? [];
  const mostRecent = sessions.at(-1);
  const lookbackStart = now - RULES.lookbackDays * DAY_MS;
  const byId = new Map(catalog.map((a) => [a.id, a]));

  // ── Pass 1: what must not be suggested right now ────────────────────────
  const notes: Note[] = [];
  const blocked = new Set<string>();
  for (const activity of catalog) {
    const hist = historyOf(activity.id);
    const note = restNote(activity, hist, now);
    if (note) {
      notes.push(note);
      blocked.add(activity.id);
    }
    // Variety: never suggest what was just played, or something played a lot today.
    if (mostRecent?.activityId === activity.id) blocked.add(activity.id);
    const playsLast24h = hist.filter((s) => now - s.startedAt < DAY_MS).length;
    if (playsLast24h >= RULES.maxPlaysPer24h) blocked.add(activity.id);
  }

  // ── Context: interests and domain balance over the last week ────────────
  const interests = interestDomains(sessions, byId, lookbackStart);
  const underExplored = leastExploredDomains(catalog, sessions, byId, lookbackStart);

  // ── Pass 2: one candidate per activity, keeping the strongest reason ────
  const candidates = new Map<string, Candidate>();
  const offer = (c: Candidate) => {
    const existing = candidates.get(c.activity.id);
    if (!existing || c.base > existing.base) candidates.set(c.activity.id, c);
  };
  const levelFor = (a: ActivityMeta): Level => historyOf(a.id).at(-1)?.level ?? startLevel(ageBand);

  for (const activity of catalog) {
    const hist = historyOf(activity.id);

    // Never played.
    if (hist.length === 0) {
      const level = startLevel(ageBand);
      const prereqs = activity.suggestedAfter;
      const finishedPrereqs = prereqs
        .map((id) => historyOf(id).filter((s) => s.outcome === 'finished').at(-1))
        .filter((s): s is ActivitySession => s !== undefined);

      if (prereqs.length > 0 && finishedPrereqs.length === prereqs.length) {
        const latest = finishedPrereqs.reduce((a, b) => (b.endedAt > a.endedAt ? b : a));
        offer({ activity, level, reason: 'next-step', base: PRIORITY['next-step'], related: latest.activityId, basedOn: 0 });
      } else if (prereqs.length > 0) {
        // Still suggestible, just later: suggestedAfter never locks anything.
        offer({ activity, level, reason: 'new-to-explore', base: PRIORITY['new-to-explore-later'], basedOn: 0 });
      } else if (interests.has(activity.domain)) {
        offer({ activity, level, reason: 'follows-interest', base: PRIORITY['follows-interest'], basedOn: 0 });
      } else {
        offer({ activity, level, reason: 'new-to-explore', base: PRIORITY['new-to-explore'], basedOn: 0 });
      }
      continue;
    }

    const last = hist.at(-1)!;
    const current = last.level;
    const lastTwo = hist.slice(-RULES.sessionsNeeded);
    const twoAtThisLevel =
      lastTwo.length === RULES.sessionsNeeded && lastTwo.every((s) => s.level === current);

    // Support: only for activities with defined answers, and only after two tries.
    if (activity.scoring === 'answer' && twoAtThisLevel && lastTwo.every(neededHelp)) {
      if (current !== 'easier') {
        offer({ activity, level: step(current, -1), reason: 'try-easier', base: PRIORITY['try-easier'], basedOn: lastTwo.length });
        continue;
      }
      // Already at the simplest version: offer the same idea through a different activity.
      const alternative = findAlternative(activity, catalog, blocked, historyOf);
      if (alternative) {
        // A new alternative starts at its simplest version; a familiar one keeps its level.
        const tried = historyOf(alternative.id).length > 0;
        offer({
          activity: alternative,
          level: tried ? levelFor(alternative) : 'easier',
          reason: 'different-way',
          base: PRIORITY['different-way'],
          related: activity.id,
          basedOn: lastTwo.length,
        });
      }
      // The activity itself rests (pass 1). Once the rest is over it falls through
      // to revisit / play-again below, at the simplest level, never to a challenge.
      if (now - last.endedAt < RULES.restDays * DAY_MS) continue;
    } else if (twoAtThisLevel && current !== 'harder') {
      // Challenge: answers went smoothly, or (for activities without answers) it was finished twice.
      const ready =
        activity.scoring === 'answer'
          ? lastTwo.every(wentSmoothly)
          : lastTwo.every((s) => s.outcome === 'finished');
      if (ready) {
        offer({ activity, level: step(current, +1), reason: 'gentle-challenge', base: PRIORITY['gentle-challenge'], basedOn: lastTwo.length });
        continue;
      }
    }

    if (last.outcome === 'finished' && now - last.endedAt > RULES.revisitAfterDays * DAY_MS) {
      offer({ activity, level: current, reason: 'revisit', base: PRIORITY.revisit, basedOn: hist.length });
    } else {
      offer({ activity, level: current, reason: 'play-again', base: PRIORITY['play-again'], basedOn: hist.length });
    }
  }

  // ── Pass 3: pick a varied top N ─────────────────────────────────────────
  const order = new Map(catalog.map((a, i) => [a.id, i]));
  const pool = [...candidates.values()]
    .filter((c) => !blocked.has(c.activity.id))
    .map((c) => {
      const balance = underExplored.has(c.activity.domain);
      return { ...c, balance, score: c.base + (balance ? BALANCE_BONUS : 0) };
    });

  const picked: typeof pool = [];
  while (picked.length < count && pool.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    pool.forEach((c, i) => {
      const sameDomain = picked.filter((p) => p.activity.domain === c.activity.domain).length;
      const effective = c.score - sameDomain * SAME_DOMAIN_PENALTY;
      const better =
        effective > bestScore ||
        (effective === bestScore && order.get(c.activity.id)! < order.get(pool[bestIndex].activity.id)!);
      if (better) {
        bestScore = effective;
        bestIndex = i;
      }
    });
    picked.push(pool.splice(bestIndex, 1)[0]);
  }

  const suggestions: Suggestion[] = picked.map((c) => ({
    activityId: c.activity.id,
    level: c.level,
    reason: c.reason,
    ...(c.related ? { relatedActivityId: c.related } : {}),
    balancesDomains: c.balance,
    basedOnSessions: c.basedOn,
    parentText: describeSuggestion(c.reason, c.activity, c.related ? byId.get(c.related) : undefined, c.balance),
  }));

  return { suggestions, notes };
}

// ── Helpers ────────────────────────────────────────────────────────────────

interface Candidate {
  activity: ActivityMeta;
  level: Level;
  reason: ReasonCode;
  base: number;
  related?: string;
  basedOn: number;
}

function groupByActivity(sessions: readonly ActivitySession[]): Map<string, ActivitySession[]> {
  const map = new Map<string, ActivitySession[]>();
  for (const s of sessions) {
    const list = map.get(s.activityId) ?? [];
    list.push(s);
    map.set(s.activityId, list);
  }
  return map;
}

function step(level: Level, by: 1 | -1): Level {
  const i = Math.min(LEVELS.length - 1, Math.max(0, LEVELS.indexOf(level) + by));
  return LEVELS[i];
}

/** Share of answered items right on the first try, or null when nothing with an answer was attempted. */
function firstTryRate(s: ActivitySession): number | null {
  return s.itemsAnswered > 0 ? s.itemsCorrectFirstTry / s.itemsAnswered : null;
}

function wentSmoothly(s: ActivitySession): boolean {
  const rate = firstTryRate(s);
  return (
    s.outcome === 'finished' &&
    rate !== null &&
    rate >= RULES.challengeFirstTryRate &&
    s.hintsUsed <= RULES.challengeMaxHints
  );
}

/** Note: leaving early alone is not "needed help"; it only counts if answers also show it. */
function neededHelp(s: ActivitySession): boolean {
  const rate = firstTryRate(s);
  return rate !== null && (rate < RULES.supportFirstTryRate || s.hintsUsed >= RULES.supportMinHints);
}

function restNote(activity: ActivityMeta, hist: ActivitySession[], now: number): Note | null {
  const lastTwo = hist.slice(-RULES.restAfterLeftEarly);
  if (lastTwo.length < RULES.restAfterLeftEarly) return null;
  const last = lastTwo.at(-1)!;
  const until = last.endedAt + RULES.restDays * DAY_MS;
  if (now >= until) return null;

  let kind: NoteKind | null = null;
  if (lastTwo.every((s) => s.outcome === 'left-early') && lastTwo.every((s) => !neededHelp(s))) {
    kind = 'rest-left-early';
  } else if (
    activity.scoring === 'answer' &&
    lastTwo.every((s) => s.level === 'easier') &&
    lastTwo.every(neededHelp)
  ) {
    kind = 'rest-needed-help';
  }
  return kind ? { activityId: activity.id, kind, until, parentText: describeNote(kind, activity) } : null;
}

/** Another activity that practices a shared skill through a different interaction. Untried ones first. */
function findAlternative(
  activity: ActivityMeta,
  catalog: readonly ActivityMeta[],
  blocked: Set<string>,
  historyOf: (id: string) => ActivitySession[],
): ActivityMeta | undefined {
  const options = catalog.filter(
    (b) =>
      b.id !== activity.id &&
      !blocked.has(b.id) &&
      b.template !== activity.template &&
      b.skills.some((skill) => activity.skills.includes(skill)),
  );
  return options.find((b) => historyOf(b.id).length === 0) ?? options[0];
}

function interestDomains(
  sessions: readonly ActivitySession[],
  byId: Map<string, ActivityMeta>,
  since: number,
): Set<DomainId> {
  const counts = new Map<DomainId, number>();
  for (const s of sessions) {
    const domain = byId.get(s.activityId)?.domain;
    if (!domain || s.startedAt < since || s.chosenBy !== 'child') continue;
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n >= RULES.interestChoices).map(([d]) => d));
}

/** Domains with the fewest sessions this week. Empty when all are equal (nothing to balance). */
function leastExploredDomains(
  catalog: readonly ActivityMeta[],
  sessions: readonly ActivitySession[],
  byId: Map<string, ActivityMeta>,
  since: number,
): Set<DomainId> {
  const present = DOMAINS.filter((d) => catalog.some((a) => a.domain === d));
  const counts = new Map<DomainId, number>(present.map((d) => [d, 0]));
  for (const s of sessions) {
    const domain = byId.get(s.activityId)?.domain;
    if (domain && s.startedAt >= since) counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  const values = [...counts.values()];
  const min = Math.min(...values);
  if (values.every((v) => v === min)) return new Set();
  return new Set(present.filter((d) => counts.get(d) === min));
}
