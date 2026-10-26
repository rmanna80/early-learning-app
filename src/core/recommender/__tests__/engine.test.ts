import { CATALOG } from '../../../content/catalog';
import type { ActivitySession } from '../../progress/types';
import { recommend, startLevel } from '../engine';
import { DAY_MS } from '../rules';

/**
 * Each test describes one behavior from the Phase 1 plan in plain words.
 * If you rewrite the engine yourself, these tests are the specification.
 */

const NOW = Date.UTC(2026, 9, 26, 15, 0); // a fixed "now" keeps every test repeatable
const MIN = 60_000;

/** Builds a session that ended `ago` ms before NOW. Defaults describe a smooth, finished try. */
function session(activityId: string, ago: number, over: Partial<ActivitySession> = {}): ActivitySession {
  const endedAt = NOW - ago;
  return {
    activityId,
    level: 'standard',
    startedAt: endedAt - 3 * MIN,
    endedAt,
    outcome: 'finished',
    chosenBy: 'suggestion',
    itemsAnswered: 5,
    itemsCorrectFirstTry: 5,
    hintsUsed: 0,
    ...over,
  };
}
const smooth = (id: string, ago: number, over: Partial<ActivitySession> = {}) => session(id, ago, over);
const hard = (id: string, ago: number, over: Partial<ActivitySession> = {}) =>
  session(id, ago, { itemsCorrectFirstTry: 1, hintsUsed: 4, ...over });

function run(sessions: ActivitySession[], extra: { count?: number } = {}) {
  return recommend({ catalog: CATALOG, sessions, ageBand: '3-to-3.5', now: NOW, count: extra.count ?? 3 });
}
const ids = (r: ReturnType<typeof run>) => r.suggestions.map((s) => s.activityId);
const find = (r: ReturnType<typeof run>, id: string) => r.suggestions.find((s) => s.activityId === id);

describe('starting out', () => {
  test('a brand-new child gets new activities from three different domains', () => {
    const r = run([]);
    expect(r.suggestions).toHaveLength(3);
    const domains = r.suggestions.map((s) => CATALOG.find((a) => a.id === s.activityId)!.domain);
    expect(new Set(domains).size).toBe(3);
    expect(r.suggestions.every((s) => s.reason === 'new-to-explore')).toBe(true);
  });

  test('activities with unfinished suggested-after links are not offered first', () => {
    const r = run([]);
    expect(ids(r)).not.toContain('M2'); // suggested after M1
    expect(ids(r)).not.toContain('E2'); // suggested after E1
  });

  test('the youngest age band starts at the easier level', () => {
    expect(startLevel('under-3')).toBe('easier');
    expect(startLevel('3-to-3.5')).toBe('standard');
    const r = recommend({ catalog: CATALOG, sessions: [], ageBand: 'under-3', now: NOW });
    expect(r.suggestions.every((s) => s.level === 'easier')).toBe(true);
  });
});

describe('building on what was finished', () => {
  test('finishing M1 makes M2 a next step that names M1', () => {
    const r = run([smooth('M1', 2 * DAY_MS), smooth('L1', 1 * MIN)], { count: 5 });
    const m2 = find(r, 'M2');
    expect(m2?.reason).toBe('next-step');
    expect(m2?.relatedActivityId).toBe('M1');
    expect(m2?.parentText).toContain('"Count the ducks"');
  });
});

describe('a gentle challenge', () => {
  test('two smooth tries at the same level offer the next level up', () => {
    const r = run([smooth('M1', 3 * DAY_MS), smooth('M1', 1 * DAY_MS), smooth('L1', 1 * MIN)]);
    expect(find(r, 'M1')).toMatchObject({ reason: 'gentle-challenge', level: 'harder', basedOnSessions: 2 });
  });

  test('one smooth try is not enough evidence to change level', () => {
    const r = run([smooth('M1', 1 * DAY_MS), smooth('L1', 1 * MIN)], { count: 24 });
    expect(find(r, 'M1')).toMatchObject({ reason: 'play-again', level: 'standard' });
  });

  test('smooth tries that needed two hints do not count as ready', () => {
    const r = run(
      [smooth('M1', 3 * DAY_MS, { hintsUsed: 2 }), smooth('M1', 1 * DAY_MS, { hintsUsed: 2 }), smooth('L1', 1 * MIN)],
      { count: 24 },
    );
    expect(find(r, 'M1')?.reason).toBe('play-again');
  });

  test('activities without answers step up after being finished twice, never on accuracy', () => {
    const r = run([
      session('E1', 3 * DAY_MS, { itemsAnswered: 0, itemsCorrectFirstTry: 0 }),
      session('E1', 1 * DAY_MS, { itemsAnswered: 0, itemsCorrectFirstTry: 0 }),
      smooth('L1', 1 * MIN),
    ]);
    expect(find(r, 'E1')).toMatchObject({ reason: 'gentle-challenge', level: 'harder' });
    expect(find(r, 'E1')?.parentText).not.toMatch(/smoothly|help/);
  });
});

describe('when a child needs more help', () => {
  test('two tries that needed help offer a simpler version of the same activity', () => {
    const r = run([hard('M1', 3 * DAY_MS), hard('M1', 1 * DAY_MS), smooth('L1', 1 * MIN)]);
    const m1 = find(r, 'M1');
    expect(m1).toMatchObject({ reason: 'try-easier', level: 'easier', basedOnSessions: 2 });
    expect(m1?.parentText).toContain('small sample');
    expect(ids(r)[0]).toBe('M1'); // support comes before new things
  });

  test('needing help at the simplest level rests the activity and offers the idea a different way', () => {
    const r = run([
      hard('M1', 2 * DAY_MS, { level: 'easier' }),
      hard('M1', 1 * DAY_MS, { level: 'easier' }),
      smooth('L1', 1 * MIN),
    ]);
    expect(ids(r)).not.toContain('M1');
    expect(r.notes).toContainEqual(expect.objectContaining({ activityId: 'M1', kind: 'rest-needed-help' }));
    const alt = r.suggestions.find((s) => s.reason === 'different-way');
    expect(alt?.relatedActivityId).toBe('M1');
    const altMeta = CATALOG.find((a) => a.id === alt?.activityId)!;
    expect(altMeta.template).not.toBe('tap-count'); // a different interaction …
    expect(altMeta.skills.some((s) => ['counting', 'small-quantities'].includes(s))).toBe(true); // … same idea
    expect(alt?.level).toBe('easier'); // a new alternative starts simple
  });

  test('after the rest period, the activity comes back at the simplest level, not harder', () => {
    const r = run(
      [hard('M1', 5 * DAY_MS, { level: 'easier' }), hard('M1', 4 * DAY_MS, { level: 'easier' }), smooth('L1', 1 * MIN)],
      { count: 24 },
    );
    expect(r.notes.find((n) => n.activityId === 'M1')).toBeUndefined();
    expect(find(r, 'M1')).toMatchObject({ level: 'easier' });
    expect(find(r, 'M1')?.reason).not.toBe('gentle-challenge');
  });

  test('feelings activities are never stepped down for "wrong" answers', () => {
    const r = run(
      [hard('E1', 3 * DAY_MS), hard('E1', 1 * DAY_MS), smooth('L1', 1 * MIN)],
      { count: 24 },
    );
    expect(find(r, 'E1')?.reason).not.toBe('try-easier');
    expect(r.notes.find((n) => n.activityId === 'E1')).toBeUndefined();
  });

  test('speed is ignored: very slow but accurate tries still count as smooth', () => {
    const slow = (ago: number) => ({ ...smooth('M1', ago), startedAt: NOW - ago - 40 * MIN });
    const r = run([slow(3 * DAY_MS), slow(1 * DAY_MS), smooth('L1', 1 * MIN)]);
    expect(find(r, 'M1')?.reason).toBe('gentle-challenge');
  });
});

describe('leaving early', () => {
  test('leaving early once changes nothing', () => {
    const r = run([session('S1', 1 * DAY_MS, { outcome: 'left-early', itemsAnswered: 1, itemsCorrectFirstTry: 1 }), smooth('L1', 1 * MIN)], {
      count: 24,
    });
    expect(find(r, 'S1')).toMatchObject({ reason: 'play-again', level: 'standard' });
  });

  test('leaving early twice rests the activity without treating it as difficulty', () => {
    const left = { outcome: 'left-early' as const, itemsAnswered: 1, itemsCorrectFirstTry: 1 };
    const r = run([session('S1', 2 * DAY_MS, left), session('S1', 1 * DAY_MS, left), smooth('L1', 1 * MIN)], { count: 24 });
    expect(ids(r)).not.toContain('S1');
    const note = r.notes.find((n) => n.activityId === 'S1');
    expect(note?.kind).toBe('rest-left-early');
    expect(note?.parentText).toContain('can still be chosen anytime');
    expect(note?.until).toBe(NOW - 1 * DAY_MS + 3 * DAY_MS);
  });
});

describe('variety', () => {
  test('the activity just played is never suggested again immediately', () => {
    const r = run([smooth('M1', 3 * DAY_MS), smooth('M1', 1 * MIN)], { count: 24 });
    expect(ids(r)).not.toContain('M1');
  });

  test('an activity played three times in the last day is not suggested', () => {
    const r = run(
      [smooth('S1', 60 * MIN, { hintsUsed: 3 }), smooth('S1', 40 * MIN, { hintsUsed: 3 }), smooth('S1', 20 * MIN, { hintsUsed: 3 }), smooth('L1', 1 * MIN)],
      { count: 24 },
    );
    expect(ids(r)).not.toContain('S1');
  });

  test('the same activity never appears twice, and the top three span different domains', () => {
    const r = run([smooth('M1', 2 * DAY_MS), smooth('M3', 2 * DAY_MS), smooth('L1', 1 * MIN)]);
    expect(new Set(ids(r)).size).toBe(ids(r).length);
    const domains = r.suggestions.map((s) => CATALOG.find((a) => a.id === s.activityId)!.domain);
    expect(new Set(domains).size).toBe(3);
  });

  test('a domain not explored this week gets a nudge, and the parent is told why', () => {
    const week = ['L1', 'L2', 'M1', 'M3', 'S1', 'S3', 'R2', 'R3'].map((id, i) => smooth(id, (i + 1) * DAY_MS / 2));
    const r = run([...week, smooth('L4', 1 * MIN)]);
    const emotions = r.suggestions.find((s) => CATALOG.find((a) => a.id === s.activityId)!.domain === 'emotions');
    expect(emotions?.balancesDomains).toBe(true);
    expect(emotions?.parentText).toContain('explored less this week');
  });

  test("the child's own repeated choices pull in new activities from the same area", () => {
    const r = run(
      [smooth('S1', 2 * DAY_MS, { chosenBy: 'child' }), smooth('S3', 1 * DAY_MS, { chosenBy: 'child' }), smooth('L1', 1 * MIN)],
      { count: 24 },
    );
    expect(find(r, 'S2')?.reason).toBe('follows-interest');
  });

  test('activities not played for over a week come back as a revisit', () => {
    const r = run([smooth('S3', 10 * DAY_MS, { hintsUsed: 2 }), smooth('L1', 1 * MIN)], { count: 24 });
    expect(find(r, 'S3')?.reason).toBe('revisit');
  });
});

describe('parent-facing language', () => {
  const BANNED = /\b(behind|delayed|gifted|advanced|struggl\w*|fail\w*|wrong|smart|slow|below|above average|deficien\w*)\b/i;

  test('every suggestion and note explains itself without labeling the child', () => {
    const scenarios: ActivitySession[][] = [
      [],
      [smooth('M1', 3 * DAY_MS), smooth('M1', 1 * DAY_MS), smooth('L1', 1 * MIN)],
      [hard('M1', 3 * DAY_MS), hard('M1', 1 * DAY_MS), smooth('L1', 1 * MIN)],
      [hard('M1', 2 * DAY_MS, { level: 'easier' }), hard('M1', 1 * DAY_MS, { level: 'easier' }), smooth('L1', 1 * MIN)],
      [
        session('S1', 2 * DAY_MS, { outcome: 'left-early' }),
        session('S1', 1 * DAY_MS, { outcome: 'left-early' }),
        smooth('S3', 10 * DAY_MS, { chosenBy: 'child' }),
        smooth('S5', 9 * DAY_MS, { chosenBy: 'child' }),
        smooth('L1', 1 * MIN),
      ],
    ];
    for (const sessions of scenarios) {
      const r = run(sessions, { count: 24 });
      for (const text of [...r.suggestions.map((s) => s.parentText), ...r.notes.map((n) => n.parentText)]) {
        expect(text.length).toBeGreaterThan(20);
        expect(text).not.toMatch(BANNED);
      }
    }
  });
});

describe('determinism', () => {
  test('the same history always gives the same suggestions, whatever order it arrives in', () => {
    const history = [smooth('M1', 3 * DAY_MS), hard('S1', 2 * DAY_MS), smooth('L2', 1 * DAY_MS), smooth('L1', 1 * MIN)];
    const a = run(history, { count: 24 });
    const b = run([...history].reverse(), { count: 24 });
    expect(b).toEqual(a);
  });
});
