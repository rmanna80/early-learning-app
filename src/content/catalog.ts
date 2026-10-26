import type { ActivityMeta } from '../core/content/types';

/**
 * The 24 MVP activities — metadata only.
 *
 * The full content of each activity (narration, items, images, variants)
 * goes in src/content/activities/<slug>.ts in a later step. This list is
 * what the recommender and the parent dashboard need, and it mirrors the
 * curriculum table in the Phase 1 plan.
 *
 * Every entry is a proposal pending review by early-childhood educators.
 * IDs are permanent: stored progress refers to them.
 */
export const CATALOG: readonly ActivityMeta[] = [
  // ── Language and early literacy ──────────────────────────────────────────
  {
    id: 'L1', slug: 'whats-in-the-basket', title: "What's in the basket?",
    domain: 'language', skills: ['vocabulary'], practiceLabel: 'naming familiar objects',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Name items together while unpacking groceries.',
  },
  {
    id: 'L2', slug: 'sound-match', title: 'Sound match',
    domain: 'language', skills: ['listening'], practiceLabel: 'listening for everyday sounds',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Go on a sound walk: close your eyes and guess what you hear.',
  },
  {
    id: 'L3', slug: 'rhyme-time', title: 'Rhyme time',
    domain: 'language', skills: ['rhyme', 'listening'], practiceLabel: 'hearing words that rhyme',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Make up silly rhymes together in the car.',
  },
  {
    id: 'L4', slug: 'story-steps', title: 'Story steps',
    domain: 'language', skills: ['sequencing', 'story'], practiceLabel: 'putting story steps in order',
    template: 'sequence', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Retell the bedtime routine with "first, then, last".',
  },
  {
    id: 'L5', slug: 'my-letter', title: 'My letter',
    domain: 'language', skills: ['letters'], practiceLabel: "exploring a letter's shape",
    template: 'draw-explore', scoring: 'completion', suggestedAfter: [],
    offlineIdea: 'Spot the letter on signs and cereal boxes.',
  },

  // ── Early mathematics ───────────────────────────────────────────────────
  {
    id: 'M1', slug: 'count-the-ducks', title: 'Count the ducks',
    domain: 'math', skills: ['counting', 'small-quantities'], practiceLabel: 'counting small groups',
    template: 'tap-count', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Count the stairs together, touching each step.',
  },
  {
    id: 'M2', slug: 'how-many-at-a-glance', title: 'How many at a glance?',
    domain: 'math', skills: ['small-quantities'], practiceLabel: 'seeing small amounts at a glance',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: ['M1'],
    offlineIdea: 'Hold up 1, 2 or 3 fingers quickly and ask "how many?"',
  },
  {
    id: 'M3', slug: 'snack-share', title: 'Snack share',
    domain: 'math', skills: ['comparing-amounts', 'small-quantities'], practiceLabel: 'comparing more and fewer',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Make two piles of crackers and decide which has more.',
  },
  {
    id: 'M4', slug: 'sort-the-socks', title: 'Sort the socks',
    domain: 'math', skills: ['sorting', 'classifying'], practiceLabel: 'sorting by color and size',
    template: 'sort', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Sort the laundry by color together.',
  },
  {
    id: 'M5', slug: 'one-more-bunny', title: 'One more bunny',
    domain: 'math', skills: ['counting', 'one-more-one-less'], practiceLabel: 'one more and one less',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: ['M1', 'M3'],
    offlineIdea: 'Add one block to a tower and count again.',
  },

  // ── Shapes and patterns ─────────────────────────────────────────────────
  {
    id: 'S1', slug: 'shape-hunt', title: 'Shape hunt',
    domain: 'shapes', skills: ['shapes'], practiceLabel: 'recognizing shapes',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Find circles, squares and triangles around the house.',
  },
  {
    id: 'S2', slug: 'shape-puzzle', title: 'Shape puzzle',
    domain: 'shapes', skills: ['shapes', 'spatial'], practiceLabel: 'fitting shapes into place',
    template: 'drag-match', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Trace and cut out paper shapes together.',
  },
  {
    id: 'S3', slug: 'what-comes-next', title: 'What comes next?',
    domain: 'shapes', skills: ['patterns'], practiceLabel: 'continuing patterns',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Clap, stomp, clap, stomp: take turns continuing the pattern.',
  },
  {
    id: 'S4', slug: 'big-middle-small', title: 'Big, middle, small',
    domain: 'shapes', skills: ['comparing-size', 'ordering'], practiceLabel: 'ordering by size',
    template: 'sequence', scoring: 'answer', suggestedAfter: ['M3'],
    offlineIdea: 'Line up shoes from biggest to smallest.',
  },
  {
    id: 'S5', slug: 'wheres-the-cat', title: "Where's the cat?",
    domain: 'shapes', skills: ['position-words', 'spatial'], practiceLabel: 'position words like in, on and under',
    template: 'tap-choose', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Hide a toy and give clues: "It\'s under something soft."',
  },

  // ── Reasoning and discovery ─────────────────────────────────────────────
  {
    id: 'R1', slug: 'push-and-see', title: 'Push and see',
    domain: 'reasoning', skills: ['cause-effect', 'predicting'], practiceLabel: 'cause and effect',
    template: 'draw-explore', scoring: 'completion', suggestedAfter: [],
    offlineIdea: 'Roll balls down a cushion ramp and watch what happens.',
  },
  {
    id: 'R2', slug: 'find-the-twin', title: 'Find the twin',
    domain: 'reasoning', skills: ['matching', 'memory'], practiceLabel: 'matching and remembering pictures',
    template: 'drag-match', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Match socks, or play a 3-pair card game.',
  },
  {
    id: 'R3', slug: 'who-lives-here', title: 'Who lives here?',
    domain: 'reasoning', skills: ['classifying', 'nature'], practiceLabel: 'grouping animals by where they live',
    template: 'sort', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'On a walk, spot animals and talk about where they live.',
  },
  {
    id: 'R4', slug: 'sink-or-float', title: 'Sink or float?',
    domain: 'reasoning', skills: ['predicting'], practiceLabel: 'predicting and checking',
    template: 'tap-choose', scoring: 'explore', suggestedAfter: [],
    offlineIdea: 'Test a few objects in a tub, with an adult right there and nothing small enough to swallow.',
  },
  {
    id: 'R5', slug: 'grow-a-seed', title: 'Grow a seed',
    domain: 'reasoning', skills: ['sequencing', 'nature'], practiceLabel: 'the order things grow in',
    template: 'sequence', scoring: 'answer', suggestedAfter: [],
    offlineIdea: 'Plant a bean in a cup and watch it sprout.',
  },

  // ── Emotions and social skills ──────────────────────────────────────────
  // Feelings are never scored right or wrong (scoring: 'explore' or 'completion').
  {
    id: 'E1', slug: 'how-does-bo-feel', title: 'How does Bo feel?',
    domain: 'emotions', skills: ['naming-feelings'], practiceLabel: 'naming feelings',
    template: 'tap-choose', scoring: 'explore', suggestedAfter: [],
    offlineIdea: 'Make feeling faces together in a mirror.',
  },
  {
    id: 'E2', slug: 'what-happened', title: 'What happened?',
    domain: 'emotions', skills: ['naming-feelings', 'feelings-in-situations'], practiceLabel: 'linking feelings to situations',
    template: 'tap-choose', scoring: 'explore', suggestedAfter: ['E1'],
    offlineIdea: 'While reading a book, ask "how do you think they feel?"',
  },
  {
    id: 'E3', slug: 'help-a-friend', title: 'Help a friend',
    domain: 'emotions', skills: ['kindness'], practiceLabel: 'kind and helpful choices',
    template: 'tap-choose', scoring: 'explore', suggestedAfter: [],
    offlineIdea: 'Practice asking "are you okay?" with a stuffed animal.',
  },
  {
    id: 'E4', slug: 'my-turn-your-turn', title: 'My turn, your turn',
    domain: 'emotions', skills: ['turn-taking'], practiceLabel: 'taking turns and waiting',
    template: 'drag-match', scoring: 'completion', suggestedAfter: [],
    offlineIdea: 'Take turns rolling a ball back and forth.',
  },
];
