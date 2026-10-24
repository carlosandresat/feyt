import { describe, expect, it } from 'vitest';
import { activityInterests, areaOf, parseInterests, serializeInterests } from './interests';

describe('interests', () => {
  it('maps any topic key to its area', () => {
    expect(areaOf('residencias/internet/bloque-b')).toBe('residencias');
    expect(areaOf('residencias')).toBe('residencias');
  });

  it('matches activities by kind and by the areas of their topics', () => {
    expect(
      activityInterests('assembly', ['residencias/internet', 'residencias/cortes-de-agua']),
    ).toEqual(['asambleas', 'residencias']);
    expect(activityInterests('volunteering', ['residencias/internet/bloque-b'])).toEqual([
      'voluntariado',
      'residencias',
    ]);
    expect(activityInterests('cultural', [])).toEqual([]);
  });

  it('parses only known tokens, in their canonical order', () => {
    const known = ['residencias', 'bienestar', 'asambleas'];
    expect(parseInterests('asambleas, residencias,nope,residencias', known)).toEqual([
      'residencias',
      'asambleas',
    ]);
    expect(parseInterests(null, known)).toEqual([]);
    expect(parseInterests('', known)).toEqual([]);
  });

  it('serializes in canonical order so equal selections give equal URLs', () => {
    const known = ['residencias', 'bienestar', 'asambleas'];
    expect(serializeInterests(new Set(['asambleas', 'residencias']), known)).toBe(
      'residencias,asambleas',
    );
    expect(serializeInterests([], known)).toBe('');
  });
});
