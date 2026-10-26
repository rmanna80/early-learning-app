import type { ActivityMeta, DomainId } from '../content/types';

/**
 * Why something was suggested. The code is stored with every suggestion;
 * the sentence is what the parent reads on the dashboard.
 */
export type ReasonCode =
  | 'try-easier'
  | 'different-way'
  | 'gentle-challenge'
  | 'next-step'
  | 'follows-interest'
  | 'revisit'
  | 'new-to-explore'
  | 'play-again';

export type NoteKind = 'rest-left-early' | 'rest-needed-help';

/** Plain words for each domain, used in parent sentences. */
export const DOMAIN_WORDS: Record<DomainId, string> = {
  language: 'words and stories',
  math: 'numbers and counting',
  shapes: 'shapes and patterns',
  reasoning: 'thinking and discovering',
  emotions: 'feelings',
};

/**
 * Writing rules for every sentence below:
 * - Describe what happened ("needed extra help"), never the child ("is behind").
 * - Say how little the data shows when it matters ("two tries is a small sample").
 * - No comparisons with other children, no diagnoses, no praise inflation.
 * A test scans every sentence for words that break these rules.
 *
 * English only for now: when Spanish is added, these move to the string
 * tables under the same reason codes.
 */
export function describeSuggestion(
  reason: ReasonCode,
  activity: ActivityMeta,
  related: ActivityMeta | undefined,
  balance: boolean,
): string {
  const t = `"${activity.title}"`;
  const r = related ? `"${related.title}"` : 'an earlier activity';
  let text: string;

  switch (reason) {
    case 'try-easier':
      text =
        `The last two tries of ${t} needed extra help, so the next one is a simpler version. ` +
        'Two tries is a small sample, and needing help is a normal part of learning.';
      break;
    case 'different-way':
      text =
        `${t} practices a related idea in a different way: ${activity.practiceLabel}. ` +
        `It's offered because the last two tries of ${r} needed extra help.`;
      break;
    case 'gentle-challenge':
      text =
        activity.scoring === 'answer'
          ? `The last two tries of ${t} went smoothly with little help, so the next one is a little harder. ` +
            'The simpler version is always there to go back to.'
          : `${t} was finished the last two times, so the next one adds a little more.`;
      break;
    case 'next-step':
      text = `${t} builds on ${r}, which was finished recently.`;
      break;
    case 'follows-interest':
      text = `${DOMAIN_WORDS[activity.domain]} activities have been a favorite choice lately, and ${t} is a new one in that area.`;
      text = text.charAt(0).toUpperCase() + text.slice(1);
      break;
    case 'revisit':
      text = `${t} hasn't been played in over a week, so it's a good moment to come back to it.`;
      break;
    case 'new-to-explore':
      text = `${t} is new: it practices ${activity.practiceLabel}.`;
      break;
    case 'play-again':
      text = `${t} is a familiar activity to play again.`;
      break;
  }

  if (balance) {
    text += ` It's also from ${DOMAIN_WORDS[activity.domain]}, an area explored less this week.`;
  }
  return text;
}

export function describeNote(kind: NoteKind, activity: ActivityMeta): string {
  const t = `"${activity.title}"`;
  switch (kind) {
    case 'rest-left-early':
      return (
        `${t} was stopped early the last two times, so it won't be suggested for a few days. ` +
        'It can still be chosen anytime.'
      );
    case 'rest-needed-help':
      return (
        `${t} needed a lot of help even in its simplest version, so it won't be suggested for a few days. ` +
        'Two tries is a small sample, and needing help is a normal part of learning.'
      );
  }
}
