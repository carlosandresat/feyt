# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static site for FEYT (Federación de Estudiantes Yachay Tech) that tracks student issues as a navigable tree of any depth (e.g. Residencias → Internet → Bloque B). Each issue shows its status, a timeline of updates, documents, and linked assemblies and events. Assemblies and events/activities also have their own sections outside the tree. The site is bilingual (es/en). Content lives in Git and is edited only via Pull Requests, with no CMS; contributors follow `CONTRIBUTING.md`.

## Conventions

- **Language:** everything that is code is in **English**:
  - identifiers, file and folder names;
  - collection names, frontmatter keys and enum values;
  - CSS classes, comments, commit messages and docs.

  Everything **end users see is in Spanish**:
  - UI strings in `src/i18n/ui.ts` (with their English translations);
  - content bodies, titles and summaries;
  - URLs and slugs (`/temas/`, `/asambleas/`, `/buscar/`, `residencias/internet`). Page file names under `src/pages/` are therefore Spanish.

- **Atomic commits:** after each coherent, self-contained change that passes `check`, `test` and `build`, commit it without waiting to be asked. One logical change per commit; don't bundle unrelated work. Don't push unless asked.
- **Learning mode:** the maintainer is learning Astro and Cloudflare, coming from Next.js and Vercel. When introducing or touching a framework/platform concept, briefly explain how it works (in Spanish, the language used in chat) and contrast it with Next.js/Vercel where useful.

## Commands

```bash
pnpm dev                     # dev server on :4321. For background use: pnpm astro dev --background
                             # (then `astro dev stop | status | logs`)
pnpm build                   # astro build + pagefind --site dist (search only works after build)
pnpm preview                 # serve dist/
pnpm check                   # astro check (types, incl. .astro files and content schemas)
pnpm test                    # vitest run
pnpm vitest run src/lib/tree.test.ts -t "status out of sync"   # single file / single test
pnpm format                  # prettier (CI runs format:check)
```

CI (`.github/workflows/ci.yml`) runs `format:check`, `check`, `test` and `build`.

Toolchain constraints:

- **TypeScript is pinned to ^6** because `@astrojs/check` does not support TS 7 yet.
- pnpm 11 blocks install scripts. Allowed builds go in `pnpm-workspace.yaml` (`allowBuilds`).
- Astro 7 uses Zod 4. Import `z` from `astro/zod`, not from `astro:content`, which is deprecated.

## Architecture

### Content model (`src/content.config.ts`)

Folder structure **is** the topic tree. A topic's **key** is its folder path under `src/content/topics/` (e.g. `residencias/internet`). That key is used as:

- the collection id;
- the URL (`/temas/<key>/`);
- the parent relation, derived by stripping the last segment;
- the reference that phase-2 DB rows (opinions, volunteers) will point to.

Treat keys as stable. Renaming a folder requires an entry in `public/_redirects`.

Eight collections, all loaded with `glob` and a custom `generateId`:

- `topics`: `**/topic.yaml`, holding language-neutral data (`status`, `priority`, `order`, documents, links). Nodes without `status` are grouping areas.
- `topicTexts`: `**/{es,en}.md`, holding title, summary and body per locale. The id is `<key>/<locale>`. Areas may add `interest`, the first-person phrase shown in the home picker.
- `updates` / `updatesEn`: `**/updates/*.es.md` and `*.en.md`. The id is `<key>/updates/<slug>`, and the English entry shares the id of its Spanish one. `updates` is a reserved folder name.
- `assemblies` / `assembliesEn`: `src/content/assemblies/*.{es,en}.md`. `topics: reference('topics')[]` links an assembly to topic keys.
- `events` / `eventsEn`: `src/content/events/*.{es,en}.md`, events and activities outside the tree, with `category`, optional `endDate` and `registrationUrl`, and optional `topics` references. The TS type is `CampusEvent`, which avoids shadowing the DOM `Event`.

Assemblies and events share `SCHEDULE_STATUSES` (scheduled/held/cancelled) and `FORMATS`, but have separate UI labels, because Spanish grammatical gender differs ("Convocada" vs "Programado"). Use `upcoming()` / `past()` from `content.ts` to split them, and `ScheduleList.astro` to render them.

Rule: **data is written once**, in `topic.yaml` or in the `.es.md` file, and `en` files only translate text. Spanish is required. English is optional and falls back to Spanish with a notice (`pickLocale`).

### Layering in `src/lib/`

- `domain.ts`: enums (statuses, types…) shared by the schemas, the logic and the UI.
- `tree.ts` and `i18n.ts`: **pure** functions with no `astro:*` imports, so Vitest can test them directly. `tree.ts` includes `validateContent`, which covers cross-entry integrity that Zod can't check:
  - every topic has `es.md`;
  - every parent folder has a `topic.yaml`;
  - no orphan translations;
  - no event ending before it starts;
  - referenced `/docs/...` files exist in `public/`;
  - the `status` in `topic.yaml` equals the `status` of the latest update that set one.
- `content.ts`: the only module that calls `getCollection`. It runs `validateContent` and **throws, failing `astro build`**, when content is inconsistent. It then builds the tree and exposes helpers (`getTopic`, `getAncestors`, `topicPaths`, `pickLocale`…). It memoizes in build and reloads on every call in dev.

### Pages, views and i18n

- Astro i18n is set up with `defaultLocale: 'es'` and `prefixDefaultLocale: false`, so English lives under `/en/...` with the same slugs.
- Files in `src/pages/**` and `src/pages/en/**` are thin wrappers. Each passes `locale` to a view in `src/views/`, where all page logic lives.
- To add a page, create the view and **both** wrappers.
- `temas/[...key].astro` is a single catch-all route rendering any tree depth. Its `getStaticPaths = topicPaths`.
- UI strings live in `src/i18n/ui.ts`. `en` is typed as `Record<keyof typeof es, string>`, so a missing key fails `astro check`. Use them through `t(locale)`.
- Use the route helpers in `lib/i18n.ts` (`localizedPath`, `topicPath`, `switchLocale`) rather than hand-building URLs.
- Dates: date-only YAML values are UTC midnight, so `formatDate` formats them in UTC. Datetimes (assemblies, events) are shown in `America/Guayaquil` (`formatDateRange`, `dateParts`). `Intl` output uses non-breaking spaces ("a. m."), so tests must match with `\s`.
- Pages without a full-bleed layout get the `.page` width from `Base.astro`. Pass `wide` to manage width yourself, as the home hero does.

## Design system: "bioluminescent neuron"

The topic tree is a neuron. The soma is FEYT (or the current topic), dendrites are areas, and each issue is a terminal lit with its status color. The **dark theme ("abyss")** is bioluminescence in deep water. The **light theme ("slide")** is the same neuron as stained ink on a microscope slide, so it has no glow. The brand blues come from the FEYT logo (`#79AEC3`, `#3383AA`, `#195D78`). Don't embed the raster logo: it's the old AEYT one and isn't approved for the site yet.

- **Tokens** live in `src/styles/global.css`. Every color is a `light-dark()` pair resolved from `color-scheme`, which follows the OS by default and is forced by `html[data-theme]` from the header toggle. An inline script in `Base.astro` applies a saved theme before first paint. `--glow` is `transparent` in light, so glow effects disappear there automatically. Use `light-dark(transparent, <color>)` for other dark-only effects.
- **Status colors** (`--status-<status>`) are all WCAG AA on both backgrounds and surfaces. Status is never shown by color alone: it always comes with its label.
- **Type:** Unbounded (`--font-display`) for headings and area names, Atkinson Hyperlegible Next (`--font-body`) for everything else. Both are self-hosted via the Astro Fonts API (`fonts` in `astro.config.mjs`, `<Font>` in `Base.astro`).
- **Principles:**
  - The neuron is the one bold element; everything else stays quiet.
  - Light means information: only statuses and the path under interaction glow. No decorative gradients.
  - Curves only appear in the tree, the breadcrumbs and the timeline axon.
  - One orchestrated motion, the growth sequence on the home page. Everything else only reacts to the user. `prefers-reduced-motion` is honored globally.
- **Avoid** dot-joined metadata strings ("A · B · C"), all-caps eyebrow labels, arrow-suffixed links and identical card grids. Use labeled facts (`Facts.astro`, `<dl>`) and chips instead.

Key components:

- `NeuronTree.astro` + `lib/neuron.ts`:
  - The geometry is pure and tested: one row per node in pre-order, with depth as the indent and key-seeded curves, so the result is deterministic.
  - The SVG is decorative (`aria-hidden`); the accessible content is the HTML list of links laid over it row by row.
  - It renders a wide and a narrow drawing, switched with a container query. Both share `rowHeight`, so the HTML rows fit either one. The metrics reach the CSS through `define:vars`.
  - Animations use `fill-mode: backwards`, never `forwards`, so they don't lock the opacity that hover and filter need afterwards.
  - The filter dims instead of hiding, which keeps the geometry intact.
- `Breadcrumbs.astro` draws the neuron path. `Timeline.astro` draws the axon, with a synapse per update lit in the status it set.
- `ScheduleList.astro` is the date-led list for assemblies and events.
- `InterestPicker.astro` ("Tu frente") sits next to the neuron on the home page:
  - one toggle per area, plus assemblies and volunteering. Tokens come from `lib/interests.ts` (pure, tested); `asambleas` and `voluntariado` are reserved area names, enforced by `validateContent`;
  - every matching issue and upcoming activity is rendered at build time and hidden, and the script only toggles `hidden`;
  - it lights the chosen branches by setting `data-highlight` on the `NeuronTree`, which watches the attribute with a `MutationObserver`;
  - the selection lives in `?frente=` (shareable) and in `localStorage`.
- **Pagefind theming** (`Search.astro`): its components reset `color-scheme`, so the `--pf-*` color variables are registered with `@property` as `<color>`. That way `light-dark()` resolves on our container before Pagefind reads them.

### Search

Pagefind (Component UI) indexes only elements marked `data-pagefind-body`, which are the topic, assembly and event articles. It builds one index per `<html lang>`. Filters come from `data-pagefind-filter="status"` and `data-pagefind-filter="area"` in `TopicPage.astro`. `/pagefind/` exists only after `pnpm build`, which is why `Search.astro` loads it with `is:inline`.

### Deployment

The site deploys to Cloudflare Workers with Static Assets (`wrangler.jsonc` serves `./dist`, with `not_found_handling: 404-page`). `public/_redirects` is honored. It is fully static (`output: 'static'`).

Phase 2 (planned, not built):

- `@astrojs/cloudflare` adapter, with `prerender = false` only on interactive routes;
- Cloudflare D1 + Drizzle;
- Google login restricted to `@yachaytech.edu.ec`;
- user data keyed by topic key, while official content stays in Git.

`src/content/` currently holds **sample content** marked with a warning banner.
