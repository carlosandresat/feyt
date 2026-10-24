// Interests for the home page's "Tu frente" picker. Each interest is a token: an area's key (a
// top-level topic) or one of the reserved participation tokens. Pure (no `astro:*`, no DOM) so the
// client script and Vitest can both use it.
// Tokens show up in shareable URLs (`/?frente=residencias,voluntariado`), so they're Spanish slugs.

import type { EventCategory } from './domain';

export const ASSEMBLIES_INTEREST = 'asambleas';
export const VOLUNTEERING_INTEREST = 'voluntariado';
/** Can't be used as area folder names, or the picker couldn't tell them apart. */
export const RESERVED_INTERESTS = [ASSEMBLIES_INTEREST, VOLUNTEERING_INTEREST] as const;

/** Query parameter that carries the selection in a shared link. */
export const INTERESTS_PARAM = 'frente';

/** 'residencias/internet/bloque-b' → 'residencias' */
export const areaOf = (key: string) => key.split('/')[0];

/** Interests an activity matches: its own kind, plus the areas of the topics it links to. */
export function activityInterests(kind: 'assembly' | EventCategory, topicKeys: string[]): string[] {
  const own =
    kind === 'assembly'
      ? [ASSEMBLIES_INTEREST]
      : kind === 'volunteering'
        ? [VOLUNTEERING_INTEREST]
        : [];
  return [...new Set([...own, ...topicKeys.map(areaOf)])];
}

/** Reads a comma-separated selection, keeping only known tokens (no duplicates). */
export function parseInterests(value: string | null, known: readonly string[]): string[] {
  if (!value) return [];
  const picked = new Set(value.split(',').map((s) => s.trim()));
  return known.filter((token) => picked.has(token));
}

/** Writes a selection in the same order as `known`, so equal selections give equal URLs. */
export function serializeInterests(selected: Iterable<string>, known: readonly string[]): string {
  const picked = new Set(selected);
  return known.filter((token) => picked.has(token)).join(',');
}
