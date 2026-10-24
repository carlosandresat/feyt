import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  DOCUMENT_TYPES,
  EVENT_CATEGORIES,
  FORMATS,
  PLATFORMS,
  PRIORITIES,
  SCHEDULE_STATUSES,
  STATUSES,
  UPDATE_TYPES,
} from './lib/domain';

// Model rules:
// - DATA (status, dates, documents, references) is written once: in `topic.yaml` for topics and in
//   the `.es.md` file for updates and assemblies.
// - `en` files only translate TEXT (title, summary, body). When missing, Spanish is shown.
// - A topic's key is its folder path (e.g. `residencias/internet`). It is stable: phase 2 will store
//   opinions and volunteers in a database referencing this key.

const stripExtension = (entry: string, extension: RegExp) =>
  entry.replace(/\\/g, '/').replace(extension, '');

const document = z
  .object({
    title: z.string(),
    /** Public path under /docs/...; the file lives in public/docs/... */
    file: z.string().startsWith('/docs/').optional(),
    url: z.url().optional(),
    date: z.coerce.date().optional(),
    type: z.enum(DOCUMENT_TYPES).default('other'),
  })
  .refine((d) => Boolean(d.file) !== Boolean(d.url), {
    message: 'Each document needs either `file` or `url` (exactly one).',
  });

const link = z.object({
  platform: z.enum(PLATFORMS),
  url: z.url(),
  title: z.string().optional(),
});

const TOPICS_BASE = './src/content/topics';
const ASSEMBLIES_BASE = './src/content/assemblies';
const EVENTS_BASE = './src/content/events';

/** Language-neutral data of each tree node. id = folder path. */
const topics = defineCollection({
  loader: glob({
    pattern: '**/topic.yaml',
    base: TOPICS_BASE,
    generateId: ({ entry }) => stripExtension(entry, /\/topic\.yaml$/),
  }),
  schema: z.object({
    /** Optional: grouping nodes (e.g. an area like "Residencias") have no status. */
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).default('medium'),
    /** Order among siblings (lowest first). */
    order: z.number().default(0),
    tags: z.array(z.string()).default([]),
    created: z.coerce.date(),
    documents: z.array(document).default([]),
    links: z.array(link).default([]),
  }),
});

/** Per-language text of each topic. id = `<key>/<locale>`. */
const topicTexts = defineCollection({
  loader: glob({
    pattern: '**/{es,en}.md',
    base: TOPICS_BASE,
    generateId: ({ entry }) => stripExtension(entry, /\.md$/),
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /**
     * Optional, areas only: a first-person phrase for the home page's interest picker
     * (e.g. "Vivo en las residencias"). Falls back to the title.
     */
    interest: z.string().optional(),
  }),
});

/** Timeline updates in Spanish: the source of the data. id = `<key>/updates/<slug>`. */
const updates = defineCollection({
  loader: glob({
    pattern: '**/updates/*.es.md',
    base: TOPICS_BASE,
    generateId: ({ entry }) => stripExtension(entry, /\.es\.md$/),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(UPDATE_TYPES),
    /** Set when this update changes the topic's status (kept in the history). */
    status: z.enum(STATUSES).optional(),
    documents: z.array(document).default([]),
    links: z.array(link).default([]),
  }),
});

/** Optional translation of an update. Same id as its Spanish version. */
const updatesEn = defineCollection({
  loader: glob({
    pattern: '**/updates/*.en.md',
    base: TOPICS_BASE,
    generateId: ({ entry }) => stripExtension(entry, /\.en\.md$/),
  }),
  schema: z.object({
    title: z.string(),
  }),
});

/** Assemblies in Spanish: the source of the data. id = file name without `.es.md`. */
const assemblies = defineCollection({
  loader: glob({
    pattern: '*.es.md',
    base: ASSEMBLIES_BASE,
    generateId: ({ entry }) => stripExtension(entry, /\.es\.md$/),
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /** Include time and Ecuador's offset, e.g. 2026-09-15T18:00:00-05:00 */
    date: z.coerce.date(),
    place: z.string(),
    format: z.enum(FORMATS),
    status: z.enum(SCHEDULE_STATUSES),
    /** Keys of the topics discussed. `reference()` fails the build if a key doesn't exist. */
    topics: z.array(reference('topics')).default([]),
    documents: z.array(document).default([]),
    links: z.array(link).default([]),
  }),
});

/** Optional translation of an assembly. Same id as its Spanish version. */
const assembliesEn = defineCollection({
  loader: glob({
    pattern: '*.en.md',
    base: ASSEMBLIES_BASE,
    generateId: ({ entry }) => stripExtension(entry, /\.en\.md$/),
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
  }),
});

/** Events and activities in Spanish: the source of the data. Separate from the topic tree. */
const events = defineCollection({
  loader: glob({
    pattern: '*.es.md',
    base: EVENTS_BASE,
    generateId: ({ entry }) => stripExtension(entry, /\.es\.md$/),
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(EVENT_CATEGORIES),
    /** Start, with time and Ecuador's offset, e.g. 2026-10-15T16:00:00-05:00 */
    date: z.coerce.date(),
    /** Optional end, for multi-hour or multi-day events. */
    endDate: z.coerce.date().optional(),
    place: z.string(),
    format: z.enum(FORMATS),
    status: z.enum(SCHEDULE_STATUSES),
    /** Sign-up form, if the event needs registration. */
    registrationUrl: z.url().optional(),
    /** Optional: topics this activity relates to (e.g. a clean-up day for a residences issue). */
    topics: z.array(reference('topics')).default([]),
    documents: z.array(document).default([]),
    links: z.array(link).default([]),
  }),
});

/** Optional translation of an event. Same id as its Spanish version. */
const eventsEn = defineCollection({
  loader: glob({
    pattern: '*.en.md',
    base: EVENTS_BASE,
    generateId: ({ entry }) => stripExtension(entry, /\.en\.md$/),
  }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
  }),
});

export const collections = {
  topics,
  topicTexts,
  updates,
  updatesEn,
  assemblies,
  assembliesEn,
  events,
  eventsEn,
};
