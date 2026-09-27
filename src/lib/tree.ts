// Pure logic for the topic tree and content validation.
// No `astro:*` imports so it can be tested with Vitest; src/lib/content.ts wires it to the real
// collections.

import type { Status } from './domain';

/** 'residencias/internet/bloque-b' → 'residencias/internet'; a root node → null. */
export function parentKey(key: string): string | null {
  const i = key.lastIndexOf('/');
  return i === -1 ? null : key.slice(0, i);
}

/** Ancestor keys from the root down (excluding the key itself). */
export function ancestorKeys(key: string): string[] {
  const parts = key.split('/');
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
}

export interface NodeBase {
  key: string;
  order: number;
  status?: Status;
}

export type TreeNode<T extends NodeBase> = T & { children: TreeNode<T>[] };

/** Builds the forest (roots with their children), sorting siblings by `order`, then by key. */
export function buildTree<T extends NodeBase>(topics: T[]): TreeNode<T>[] {
  const nodes = new Map<string, TreeNode<T>>(topics.map((t) => [t.key, { ...t, children: [] }]));
  const roots: TreeNode<T>[] = [];
  for (const node of nodes.values()) {
    const parent = parentKey(node.key);
    const parentNode = parent ? nodes.get(parent) : undefined;
    if (parentNode) parentNode.children.push(node);
    else roots.push(node);
  }
  const sort = (list: TreeNode<T>[]) => {
    list.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

/** All descendants of a node (depth-first, excluding the node itself). */
export function descendants<T extends NodeBase>(node: TreeNode<T>): TreeNode<T>[] {
  return node.children.flatMap((c) => [c, ...descendants(c)]);
}

/** How many descendants are in each status. Used to summarize an area that groups issues. */
export function statusSummary<T extends NodeBase>(
  node: TreeNode<T>,
): Partial<Record<Status, number>> {
  const summary: Partial<Record<Status, number>> = {};
  for (const d of descendants(node)) {
    if (d.status) summary[d.status] = (summary[d.status] ?? 0) + 1;
  }
  return summary;
}

/** Newest first; on equal dates, by id descending (slugs start with the date). */
export function sortByDateDesc<T extends { id: string; date: Date }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.date.getTime() - a.date.getTime() || b.id.localeCompare(a.id));
}

// ---------------------------------------------------------------------------
// Integrity validation (what Zod can't check entry by entry)
// ---------------------------------------------------------------------------

export interface ValidationInput {
  topics: { key: string; status?: Status; files: string[] }[];
  /** topicTexts ids: `<key>/<locale>` */
  texts: string[];
  updates: { id: string; date: Date; status?: Status; files: string[] }[];
  /** updatesEn ids */
  updatesEn: string[];
  assemblies: { id: string; files: string[] }[];
  /** assembliesEn ids */
  assembliesEn: string[];
  events: { id: string; date: Date; endDate?: Date; files: string[] }[];
  /** eventsEn ids */
  eventsEn: string[];
  /** Takes a public path (e.g. /docs/x.pdf) and tells whether the file exists in public/. */
  fileExists: (path: string) => boolean;
}

export const UPDATES_DIR = 'updates';

/** `residencias/internet/updates/2026-09-02-letter` → `residencias/internet` */
export function topicKeyOfUpdate(updateId: string): string {
  return updateId.slice(0, updateId.lastIndexOf(`/${UPDATES_DIR}/`));
}

/** Returns the list of errors; empty when content is consistent. */
export function validateContent(input: ValidationInput): string[] {
  const errors: string[] = [];
  const keys = new Set(input.topics.map((t) => t.key));
  const texts = new Set(input.texts);

  for (const topic of input.topics) {
    if (topic.key.split('/').includes(UPDATES_DIR)) {
      errors.push(`"${topic.key}": "${UPDATES_DIR}" is a reserved name and can't be a topic.`);
    }
    if (!texts.has(`${topic.key}/es`)) {
      errors.push(`"${topic.key}": missing es.md (Spanish is required).`);
    }
    const parent = parentKey(topic.key);
    if (parent && !keys.has(parent)) {
      errors.push(`"${topic.key}": its parent folder "${parent}" has no topic.yaml.`);
    }
  }

  for (const id of input.texts) {
    const key = id.slice(0, id.lastIndexOf('/'));
    if (!keys.has(key)) errors.push(`"${id}.md" has no topic.yaml in its folder.`);
  }

  const updatesByTopic = new Map<string, ValidationInput['updates']>();
  for (const update of input.updates) {
    const key = topicKeyOfUpdate(update.id);
    if (!keys.has(key)) {
      errors.push(`Update "${update.id}": folder "${key}" has no topic.yaml.`);
      continue;
    }
    updatesByTopic.set(key, [...(updatesByTopic.get(key) ?? []), update]);
  }

  const updateIds = new Set(input.updates.map((u) => u.id));
  for (const id of input.updatesEn) {
    if (!updateIds.has(id)) errors.push(`"${id}.en.md" has no matching "${id}.es.md".`);
  }
  const assemblyIds = new Set(input.assemblies.map((a) => a.id));
  for (const id of input.assembliesEn) {
    if (!assemblyIds.has(id)) errors.push(`Assembly "${id}.en.md" has no matching ".es.md".`);
  }
  const eventIds = new Set(input.events.map((e) => e.id));
  for (const id of input.eventsEn) {
    if (!eventIds.has(id)) errors.push(`Event "${id}.en.md" has no matching ".es.md".`);
  }
  for (const event of input.events) {
    if (event.endDate && event.endDate < event.date) {
      errors.push(`Event "${event.id}": endDate is before date.`);
    }
  }

  // topic.yaml's status must match the latest update that recorded a status change.
  for (const topic of input.topics) {
    const latest = sortByDateDesc(updatesByTopic.get(topic.key) ?? []).find((u) => u.status);
    if (latest && latest.status !== topic.status) {
      errors.push(
        `"${topic.key}": topic.yaml has status "${topic.status ?? '(none)'}" but the latest ` +
          `update with a status ("${latest.id}") says "${latest.status}". Update topic.yaml.`,
      );
    }
  }

  const withFiles = [
    ...input.topics.map((t) => ({ source: `topic "${t.key}"`, files: t.files })),
    ...input.updates.map((u) => ({ source: `update "${u.id}"`, files: u.files })),
    ...input.assemblies.map((a) => ({ source: `assembly "${a.id}"`, files: a.files })),
    ...input.events.map((e) => ({ source: `event "${e.id}"`, files: e.files })),
  ];
  for (const { source, files } of withFiles) {
    for (const file of files) {
      if (!input.fileExists(file)) {
        errors.push(`The ${source} references "${file}", but public${file} doesn't exist.`);
      }
    }
  }

  return errors;
}
