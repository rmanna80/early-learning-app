import { DOMAINS, TEMPLATES, type ActivityMeta } from './types';

/**
 * Checks a catalog for mistakes that would otherwise surface as a broken
 * screen in front of a child. Returns a list of human-readable problems;
 * an empty list means the catalog is valid.
 *
 * This runs in the test suite, so a bad content edit fails the build.
 */
export function validateCatalog(catalog: readonly ActivityMeta[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();

  for (const a of catalog) {
    if (ids.has(a.id)) problems.push(`${a.id}: duplicate id`);
    ids.add(a.id);

    if (!(DOMAINS as readonly string[]).includes(a.domain)) {
      problems.push(`${a.id}: unknown domain "${a.domain}"`);
    }
    if (!(TEMPLATES as readonly string[]).includes(a.template)) {
      problems.push(`${a.id}: unknown template "${a.template}"`);
    }
    if (a.template === 'draw-explore' && a.scoring === 'answer') {
      problems.push(`${a.id}: draw-explore activities have no right answers, so scoring cannot be "answer"`);
    }
    if (a.skills.length === 0) problems.push(`${a.id}: needs at least one skill`);
    for (const field of ['slug', 'title', 'practiceLabel', 'offlineIdea'] as const) {
      if (a[field].trim() === '') problems.push(`${a.id}: ${field} is empty`);
    }
  }

  for (const a of catalog) {
    for (const p of a.suggestedAfter) {
      if (p === a.id) problems.push(`${a.id}: lists itself in suggestedAfter`);
      else if (!ids.has(p)) problems.push(`${a.id}: suggestedAfter refers to unknown activity "${p}"`);
    }
  }

  const cycle = findCycle(catalog);
  if (cycle) problems.push(`suggestedAfter forms a loop: ${cycle.join(' -> ')}`);

  return problems;
}

/** Depth-first search for a loop in the suggestedAfter links (A after B after A). */
function findCycle(catalog: readonly ActivityMeta[]): string[] | null {
  const byId = new Map(catalog.map((a) => [a.id, a]));
  const state = new Map<string, 'visiting' | 'done'>();

  const visit = (id: string, path: string[]): string[] | null => {
    if (state.get(id) === 'done') return null;
    if (state.get(id) === 'visiting') return [...path, id];
    state.set(id, 'visiting');
    for (const next of byId.get(id)?.suggestedAfter ?? []) {
      if (!byId.has(next) || next === id) continue; // reported separately above
      const found = visit(next, [...path, id]);
      if (found) return found;
    }
    state.set(id, 'done');
    return null;
  };

  for (const a of catalog) {
    const found = visit(a.id, []);
    if (found) return found;
  }
  return null;
}
