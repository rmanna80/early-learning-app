import type { Level } from '../content/types';

/**
 * Chosen by the parent at onboarding. It only picks the starting level of
 * each activity; after that, the child's own play decides.
 */
export type AgeBand = 'under-3' | '3-to-3.5' | '3.5-plus';

export type SessionOutcome = 'finished' | 'left-early';

/**
 * One play-through of one activity, written by the data layer when the
 * activity ends (or the child leaves it).
 *
 * Duration is stored for the dashboard but deliberately NOT used by the
 * recommender: speed is not a measure of understanding at this age.
 */
export interface ActivitySession {
  activityId: string;
  level: Level;
  /** Epoch milliseconds. */
  startedAt: number;
  endedAt: number;
  outcome: SessionOutcome;
  /** Whether the child picked it freely or followed the highlighted suggestion. */
  chosenBy: 'child' | 'suggestion';
  /** Items with a defined answer that the child responded to. 0 for explore and completion activities. */
  itemsAnswered: number;
  itemsCorrectFirstTry: number;
  /** Times the hint ladder stepped in (repeat narration, highlight, demonstration). */
  hintsUsed: number;
}
