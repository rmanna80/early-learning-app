import type { ActivitySession } from '../core/progress/types';

/**
 * Fake play histories for the developer preview screen.
 *
 * Nothing here is real data and nothing is stored. Each scenario builds its
 * sessions relative to "now", so the preview always looks like the history
 * just happened. Delete this folder once the real screens exist.
 */

export interface Scenario {
  id: string;
  label: string;
  description: string;
  build: (now: number) => ActivitySession[];
}

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

/** One finished, smooth session that ended `ago` ms before `now`. `over` changes any field. */
function play(now: number, activityId: string, ago: number, over: Partial<ActivitySession> = {}): ActivitySession {
  const endedAt = now - ago;
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

/** Most answers needed a hint. */
const neededHelp: Partial<ActivitySession> = { itemsCorrectFirstTry: 1, hintsUsed: 4 };

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'new',
    label: 'Brand-new child',
    description: 'No play history yet.',
    build: () => [],
  },
  {
    id: 'smooth',
    label: 'Counting went smoothly',
    description:
      '"Count the ducks" finished twice with every answer right on the first try, then one round of "What\'s in the basket?".',
    build: (now) => [play(now, 'M1', 3 * DAY), play(now, 'M1', 1 * DAY), play(now, 'L1', 5 * MIN)],
  },
  {
    id: 'help',
    label: 'Needed help',
    description: '"What\'s in the basket?" played twice at the standard level, with most answers needing hints.',
    build: (now) => [
      play(now, 'L1', 2 * DAY, neededHelp),
      play(now, 'L1', 1 * DAY, neededHelp),
      play(now, 'S1', 5 * MIN),
    ],
  },
  {
    id: 'help-easiest',
    label: 'Needed help at the simplest level',
    description: '"Count the ducks" played twice at the easier level, with most answers needing hints.',
    build: (now) => [
      play(now, 'M1', 2 * DAY, { level: 'easier', ...neededHelp }),
      play(now, 'M1', 1 * DAY, { level: 'easier', ...neededHelp }),
      play(now, 'L1', 5 * MIN),
    ],
  },
  {
    id: 'left-early',
    label: 'Left early twice',
    description: '"Shape hunt" was stopped early twice. The answers given were right, so this is not read as difficulty.',
    build: (now) => [
      play(now, 'S1', 2 * DAY, { outcome: 'left-early', itemsAnswered: 2, itemsCorrectFirstTry: 2 }),
      play(now, 'S1', 1 * DAY, { outcome: 'left-early', itemsAnswered: 2, itemsCorrectFirstTry: 2 }),
      play(now, 'L1', 5 * MIN),
    ],
  },
  {
    id: 'interest',
    label: 'Keeps choosing shapes',
    description: 'The child picked "Shape hunt" and "What comes next?" on their own this week.',
    build: (now) => [
      play(now, 'S1', 2 * DAY, { chosenBy: 'child' }),
      play(now, 'S3', 1 * DAY, { chosenBy: 'child' }),
      play(now, 'L1', 5 * MIN),
    ],
  },
  {
    id: 'busy-week',
    label: 'A busy week, no feelings yet',
    description: 'Nine activities across words, numbers, shapes and thinking this week, none about feelings.',
    build: (now) =>
      ['L1', 'L2', 'M1', 'M3', 'S1', 'S3', 'R2', 'R3', 'L4'].map((id, i, all) =>
        play(now, id, (all.length - i) * DAY * 0.5),
      ),
  },
];
