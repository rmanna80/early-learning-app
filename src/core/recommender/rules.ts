/**
 * Every number the recommender uses, in one place, so the behavior can be
 * read, discussed with educators, and changed without hunting through code.
 *
 * These are starting points, not research findings. Revisit them after the
 * pilot with real (consented) session data.
 */
export const RULES = {
  /** Never change an activity's level on a single try: one session is too small a sample. */
  sessionsNeeded: 2,

  /** "Went smoothly": at least this share of items right on the first try … */
  challengeFirstTryRate: 0.8,
  /** … and no more than this many hints in the session. */
  challengeMaxHints: 1,

  /** "Needed extra help": first-try share below this … */
  supportFirstTryRate: 0.5,
  /** … or at least this many hints in the session. */
  supportMinHints: 3,

  /**
   * Leaving early this many times in a row rests the activity for a few days.
   * Leaving early is read as "not interested right now", never as difficulty.
   */
  restAfterLeftEarly: 2,
  restDays: 3,

  /** Activities not played for this many days come back as "play it again". */
  revisitAfterDays: 7,

  /** Don't suggest the same activity again after this many plays in 24 hours. */
  maxPlaysPer24h: 3,

  /** Free choices in one domain within the lookback window that count as an interest. */
  interestChoices: 2,
  /** Window for interest and domain-balance calculations. */
  lookbackDays: 7,

  /** How many suggestions the child home screen gets (the first one is highlighted). */
  defaultCount: 3,
} as const;

/**
 * Base priority of each kind of suggestion. Higher wins.
 * Support comes first so a child who needed help isn't pushed on to new things.
 */
export const PRIORITY = {
  'try-easier': 70,
  'different-way': 68,
  'gentle-challenge': 60,
  'next-step': 50,
  'follows-interest': 45,
  revisit: 40,
  'new-to-explore': 35,
  'play-again': 20,
  /** Untried activities whose suggested-after activities haven't been finished yet. */
  'new-to-explore-later': 15,
} as const;

/** Added when an activity's domain was explored least in the last week. */
export const BALANCE_BONUS = 10;

/** Subtracted per suggestion already picked from the same domain, so the list stays varied. */
export const SAME_DOMAIN_PENALTY = 15;

export const DAY_MS = 24 * 60 * 60 * 1000;
