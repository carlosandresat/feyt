// Single entry point to content for pages and components.
// Loads the collections, builds the tree and VALIDATES integrity: if anything is inconsistent,
// `astro build` fails with a clear message (so a PR with broken content never reaches production).

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import {
  ancestorKeys,
  buildTree,
  sortByDateDesc,
  topicKeyOfUpdate,
  validateContent,
  type TreeNode,
} from './tree';
import type { Locale, Status } from './domain';

export interface Update {
  id: string;
  key: string;
  date: Date;
  es: CollectionEntry<'updates'>;
  en?: CollectionEntry<'updatesEn'>;
}

export interface TopicData {
  key: string;
  order: number;
  status?: Status;
  data: CollectionEntry<'topics'>['data'];
  texts: { es: CollectionEntry<'topicTexts'>; en?: CollectionEntry<'topicTexts'> };
  /** Newest first. */
  updates: Update[];
  /** Date of the latest update, or creation date when there are none. */
  updatedAt: Date;
}
export type Topic = TreeNode<TopicData>;

export interface Assembly {
  id: string;
  date: Date;
  es: CollectionEntry<'assemblies'>;
  en?: CollectionEntry<'assembliesEn'>;
  topicKeys: string[];
}

interface Content {
  tree: Topic[];
  topics: Map<string, Topic>;
  /** Newest first. */
  assemblies: Assembly[];
}

const filesOf = (documents: { file?: string }[]) =>
  documents.flatMap((d) => (d.file ? [d.file] : []));

async function load(): Promise<Content> {
  const [topics, texts, updates, updatesEn, assemblies, assembliesEn] = await Promise.all([
    getCollection('topics'),
    getCollection('topicTexts'),
    getCollection('updates'),
    getCollection('updatesEn'),
    getCollection('assemblies'),
    getCollection('assembliesEn'),
  ]);

  const errors = validateContent({
    topics: topics.map((t) => ({
      key: t.id,
      status: t.data.status,
      files: filesOf(t.data.documents),
    })),
    texts: texts.map((t) => t.id),
    updates: updates.map((u) => ({
      id: u.id,
      date: u.data.date,
      status: u.data.status,
      files: filesOf(u.data.documents),
    })),
    updatesEn: updatesEn.map((u) => u.id),
    assemblies: assemblies.map((a) => ({ id: a.id, files: filesOf(a.data.documents) })),
    assembliesEn: assembliesEn.map((a) => a.id),
    fileExists: (path) => existsSync(join(process.cwd(), 'public', path)),
  });
  if (errors.length > 0) {
    throw new Error(`Invalid content:\n  - ${errors.join('\n  - ')}`);
  }

  const textsById = new Map(texts.map((t) => [t.id, t]));
  const updatesEnById = new Map(updatesEn.map((u) => [u.id, u]));
  const updatesByTopic = Map.groupBy(
    updates.map((es): Update => ({
      id: es.id,
      key: topicKeyOfUpdate(es.id),
      date: es.data.date,
      es,
      en: updatesEnById.get(es.id),
    })),
    (u) => u.key,
  );

  const tree = buildTree(
    topics.map((t): TopicData => {
      const own = sortByDateDesc(updatesByTopic.get(t.id) ?? []);
      return {
        key: t.id,
        order: t.data.order,
        status: t.data.status,
        data: t.data,
        // Validation guarantees `es` exists.
        texts: { es: textsById.get(`${t.id}/es`)!, en: textsById.get(`${t.id}/en`) },
        updates: own,
        updatedAt: own[0]?.date ?? t.data.created,
      };
    }),
  );

  const index = new Map<string, Topic>();
  const addToIndex = (nodes: Topic[]) =>
    nodes.forEach((n) => {
      index.set(n.key, n);
      addToIndex(n.children);
    });
  addToIndex(tree);

  const assembliesEnById = new Map(assembliesEn.map((a) => [a.id, a]));
  const assemblyList = sortByDateDesc(
    assemblies.map((es): Assembly => ({
      id: es.id,
      date: es.data.date,
      es,
      en: assembliesEnById.get(es.id),
      topicKeys: es.data.topics.map((r) => r.id),
    })),
  );

  return { tree, topics: index, assemblies: assemblyList };
}

let cache: Promise<Content> | undefined;
/** Loaded once during build; reloaded in dev so edits show up immediately. */
export function loadContent(): Promise<Content> {
  if (import.meta.env.DEV) return load();
  return (cache ??= load());
}

/** For `getStaticPaths` of /temas/[...key]: one page per tree node, at any depth. */
export async function topicPaths() {
  const { topics } = await loadContent();
  return [...topics.keys()].map((key) => ({ params: { key } }));
}

export async function assemblyPaths() {
  const { assemblies } = await loadContent();
  return assemblies.map((a) => ({ params: { id: a.id } }));
}

export async function getTopic(key: string): Promise<Topic> {
  const topic = (await loadContent()).topics.get(key);
  if (!topic) throw new Error(`Topic "${key}" doesn't exist`);
  return topic;
}

export async function getAncestors(key: string): Promise<Topic[]> {
  const { topics } = await loadContent();
  return ancestorKeys(key).map((k) => topics.get(k)!);
}

export async function getAssembliesForTopic(key: string): Promise<Assembly[]> {
  return (await loadContent()).assemblies.filter((a) => a.topicKeys.includes(key));
}

export async function getRecentUpdates(limit: number): Promise<Update[]> {
  const { topics } = await loadContent();
  return sortByDateDesc([...topics.values()].flatMap((t) => t.updates)).slice(0, limit);
}

/**
 * Picks the requested language version, falling back to Spanish.
 * `missingTranslation` lets the page show the corresponding notice.
 */
export function pickLocale<E, T>(es: E, en: T | undefined, locale: Locale) {
  if (locale === 'en' && en) return { entry: en, missingTranslation: false };
  return { entry: es, missingTranslation: locale !== 'es' };
}

export const topicText = (topic: Topic, locale: Locale) =>
  pickLocale(topic.texts.es, topic.texts.en, locale);
export const topicTitle = (topic: Topic, locale: Locale) =>
  topicText(topic, locale).entry.data.title;
