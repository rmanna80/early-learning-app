import { CATALOG } from '../../content/catalog';
import { recommend } from '../../core/recommender';
import { SCENARIOS } from '../scenarios';

/** Each preview scenario should show the behavior its label promises. */

const NOW = Date.UTC(2026, 9, 26, 15, 0);
const run = (id: string) => {
  const scenario = SCENARIOS.find((s) => s.id === id)!;
  return recommend({ catalog: CATALOG, sessions: scenario.build(NOW), ageBand: '3-to-3.5', now: NOW });
};
const reasons = (id: string) => run(id).suggestions.map((s) => s.reason);

describe('preview scenarios', () => {
  test('every scenario has a unique id and at least one suggestion', () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
    for (const s of SCENARIOS) expect(run(s.id).suggestions.length).toBeGreaterThan(0);
  });

  test('each scenario shows what its label says', () => {
    expect(reasons('new').every((r) => r === 'new-to-explore')).toBe(true);
    expect(reasons('smooth')).toContain('gentle-challenge');
    expect(reasons('help')[0]).toBe('try-easier');
    expect(reasons('help-easiest')).toContain('different-way');
    expect(run('help-easiest').notes[0]?.kind).toBe('rest-needed-help');
    expect(run('left-early').notes[0]?.kind).toBe('rest-left-early');
    expect(reasons('interest')).toContain('follows-interest');
    expect(run('busy-week').suggestions.some((s) => s.balancesDomains)).toBe(true);
  });
});
