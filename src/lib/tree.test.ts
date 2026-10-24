import { describe, expect, it } from 'vitest';
import {
  ancestorKeys,
  buildTree,
  parentKey,
  statusSummary,
  topicKeyOfUpdate,
  validateContent,
  type ValidationInput,
} from './tree';

describe('tree keys', () => {
  it('derives parent and ancestors from the path', () => {
    expect(parentKey('residencias/internet/bloque-b')).toBe('residencias/internet');
    expect(parentKey('residencias')).toBeNull();
    expect(ancestorKeys('residencias/internet/bloque-b')).toEqual([
      'residencias',
      'residencias/internet',
    ]);
    expect(ancestorKeys('residencias')).toEqual([]);
  });

  it('gets the topic key from an update id', () => {
    expect(topicKeyOfUpdate('residencias/internet/updates/2026-09-02-letter')).toBe(
      'residencias/internet',
    );
  });
});

describe('buildTree', () => {
  const topics = [
    { key: 'b', order: 2 },
    { key: 'a', order: 1 },
    { key: 'a/z', order: 0, status: 'resolved' as const },
    { key: 'a/y', order: 0, status: 'in-progress' as const },
    { key: 'a/y/x', order: 0, status: 'in-progress' as const },
  ];

  it('nests by path and sorts by `order`, then by key', () => {
    const tree = buildTree(topics);
    expect(tree.map((n) => n.key)).toEqual(['a', 'b']);
    expect(tree[0].children.map((n) => n.key)).toEqual(['a/y', 'a/z']);
    expect(tree[0].children[0].children.map((n) => n.key)).toEqual(['a/y/x']);
  });

  it('summarizes the status of all descendants', () => {
    const [a] = buildTree(topics);
    expect(statusSummary(a)).toEqual({ 'in-progress': 2, resolved: 1 });
  });
});

describe('validateContent', () => {
  const base = (): ValidationInput => ({
    topics: [
      { key: 'res', files: [] },
      { key: 'res/internet', status: 'in-progress', files: ['/docs/letter.pdf'] },
    ],
    texts: ['res/es', 'res/internet/es', 'res/internet/en'],
    updates: [
      { id: 'res/internet/updates/1', date: new Date('2026-08-01'), status: 'reported', files: [] },
      {
        id: 'res/internet/updates/2',
        date: new Date('2026-09-01'),
        status: 'in-progress',
        files: [],
      },
      { id: 'res/internet/updates/3', date: new Date('2026-09-10'), files: [] },
    ],
    updatesEn: ['res/internet/updates/2'],
    assemblies: [{ id: 'a1', files: [] }],
    assembliesEn: ['a1'],
    events: [{ id: 'e1', date: new Date('2026-10-15T16:00:00-05:00'), files: [] }],
    eventsEn: ['e1'],
    fileExists: () => true,
  });

  it('accepts consistent content', () => {
    expect(validateContent(base())).toEqual([]);
  });

  it('requires es.md for every topic', () => {
    const input = base();
    input.texts = input.texts.filter((t) => t !== 'res/internet/es');
    expect(validateContent(input)).toEqual([expect.stringContaining('missing es.md')]);
  });

  it('detects intermediate folders without topic.yaml', () => {
    const input = base();
    input.topics.push({ key: 'res/agua/norte', files: [] });
    input.texts.push('res/agua/norte/es');
    expect(validateContent(input)).toEqual([
      expect.stringContaining('"res/agua" has no topic.yaml'),
    ]);
  });

  it('detects a status out of sync with the latest update that changed it', () => {
    const input = base();
    input.topics[1].status = 'reported';
    expect(validateContent(input)).toEqual([expect.stringContaining('says "in-progress"')]);
  });

  it('detects orphan translations and updates without a topic', () => {
    const input = base();
    input.updatesEn.push('res/internet/updates/99');
    input.assembliesEn.push('a2');
    input.eventsEn.push('e2');
    input.updates.push({ id: 'other/updates/1', date: new Date(), files: [] });
    expect(validateContent(input)).toHaveLength(4);
  });

  it('detects events that end before they start', () => {
    const input = base();
    input.events[0].endDate = new Date('2026-10-15T15:00:00-05:00');
    expect(validateContent(input)).toEqual([expect.stringContaining('endDate is before date')]);
  });

  it('detects documents missing from public/', () => {
    const input = base();
    input.fileExists = () => false;
    expect(validateContent(input)).toEqual([expect.stringContaining('public/docs/letter.pdf')]);
  });

  it('forbids topics named "updates"', () => {
    const input = base();
    input.topics.push({ key: 'res/updates', files: [] });
    input.texts.push('res/updates/es');
    expect(validateContent(input).some((m) => m.includes('reserved name'))).toBe(true);
  });

  it('forbids areas named like an interest-picker token, but not subtopics', () => {
    const input = base();
    input.topics.push({ key: 'voluntariado', files: [] }, { key: 'res/asambleas', files: [] });
    input.texts.push('voluntariado/es', 'res/asambleas/es');
    expect(validateContent(input)).toEqual([expect.stringContaining('"voluntariado": reserved')]);
  });
});
