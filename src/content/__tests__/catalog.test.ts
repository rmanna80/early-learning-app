import { DOMAINS, TEMPLATES } from '../../core/content/types';
import { validateCatalog } from '../../core/content/validateCatalog';
import { CATALOG } from '../catalog';

describe('the activity catalog', () => {
  test('passes every content check', () => {
    expect(validateCatalog(CATALOG)).toEqual([]);
  });

  test('has the 24 MVP activities across all five domains', () => {
    expect(CATALOG).toHaveLength(24);
    for (const domain of DOMAINS) {
      expect(CATALOG.filter((a) => a.domain === domain).length).toBeGreaterThanOrEqual(4);
    }
  });

  test('uses every interaction template at least once', () => {
    for (const template of TEMPLATES) {
      expect(CATALOG.some((a) => a.template === template)).toBe(true);
    }
  });

  test('never scores feelings activities as right or wrong', () => {
    expect(CATALOG.filter((a) => a.domain === 'emotions').every((a) => a.scoring !== 'answer')).toBe(true);
  });
});

describe('validateCatalog catches content mistakes', () => {
  const base = CATALOG[0];

  test('duplicate IDs and unknown links', () => {
    const problems = validateCatalog([base, { ...base }, { ...base, id: 'X1', suggestedAfter: ['NOPE'] }]);
    expect(problems).toContain('L1: duplicate id');
    expect(problems).toContain('X1: suggestedAfter refers to unknown activity "NOPE"');
  });

  test('loops in suggested-after links', () => {
    const problems = validateCatalog([
      { ...base, id: 'A', suggestedAfter: ['B'] },
      { ...base, id: 'B', suggestedAfter: ['A'] },
    ]);
    expect(problems.some((p) => p.startsWith('suggestedAfter forms a loop'))).toBe(true);
  });

  test('drawing activities that claim to have right answers', () => {
    const problems = validateCatalog([{ ...base, template: 'draw-explore', scoring: 'answer' }]);
    expect(problems[0]).toContain('draw-explore');
  });

  test('missing off-screen ideas', () => {
    expect(validateCatalog([{ ...base, offlineIdea: ' ' }])).toContain('L1: offlineIdea is empty');
  });
});
