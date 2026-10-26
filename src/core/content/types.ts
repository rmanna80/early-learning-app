/**
 * Content types — the shape every activity must have.
 *
 * This is the innermost layer of the app. It imports nothing from React,
 * Expo, or any other part of the app, so everything that depends on it
 * (the recommender, the dashboard summaries, the content files) can be
 * tested in plain Node in milliseconds.
 */

/** The five MVP learning domains. `as const` lets TypeScript derive a union type from the list. */
export const DOMAINS = ['language', 'math', 'shapes', 'reasoning', 'emotions'] as const;
export type DomainId = (typeof DOMAINS)[number];

/** The six reusable interaction templates. A new activity reuses one of these; it never needs new code. */
export const TEMPLATES = [
  'tap-choose',
  'drag-match',
  'sort',
  'sequence',
  'tap-count',
  'draw-explore',
] as const;
export type TemplateId = (typeof TEMPLATES)[number];

/** Every activity has three versions. Order matters: index 0 is the simplest. */
export const LEVELS = ['easier', 'standard', 'harder'] as const;
export type Level = (typeof LEVELS)[number];

/**
 * How an activity's results may be used.
 *
 * - 'answer':     the activity has clearly defined correct answers, so first-try
 *                 accuracy and hints may inform suggestions.
 * - 'completion': only "finished or not" is meaningful (tracing, open-ended play).
 * - 'explore':    there is no right or wrong (feelings, predictions). Recorded as
 *                 explored only; accuracy is never used or shown.
 */
export type Scoring = 'answer' | 'completion' | 'explore';

/**
 * What the rest of the app needs to know about an activity without loading
 * its full content (prompts, images, audio). The full content file per
 * activity is a later step; this metadata is what the recommender and the
 * parent dashboard work from.
 */
export interface ActivityMeta {
  /** Stable short ID, e.g. 'M1'. Never reuse or renumber — stored progress refers to it. */
  id: string;
  /** Used for the content file name and the asset folder, e.g. 'count-the-ducks'. */
  slug: string;
  /** Parent-facing title. English for now; moves to the string tables when Spanish is added. */
  title: string;
  domain: DomainId;
  /**
   * What the activity practices. Two activities that share a skill but use
   * different templates can stand in for each other ("try it a different way").
   */
  skills: string[];
  /** Parent-facing phrase that completes "practicing …", e.g. 'counting small groups'. */
  practiceLabel: string;
  template: TemplateId;
  scoring: Scoring;
  /** Soft prerequisites: they change the order of suggestions and never lock anything. */
  suggestedAfter: string[];
  /** The off-screen companion idea shown to the parent. */
  offlineIdea: string;
}
