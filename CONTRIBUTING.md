# Contributor guide: publishing content

All content is text files in `src/content/`. To publish something:

1. Create a branch.
2. Edit or add files as described below.
3. Open a Pull Request.

Cloudflare posts a **preview URL** on the PR so you can check the result. Once it's approved and merged into `main`, it's published automatically.

If something in the content is wrong (a misspelled field, a reference to a topic that doesn't exist, an out-of-sync status), **the build fails and tells you exactly what to fix**.

```bash
pnpm install
pnpm dev        # site at http://localhost:4321 (reloads on save)
```

## Language

Field names and values (`status: in-progress`) are in English, because they're code. Everything readers see is written in Spanish: titles, summaries, bodies, and folder names, which become the URLs.

## Concepts

- **Topic**: any node of the tree. It can be an area that groups issues ("Residencias") or a specific issue ("Internet"), and it can have subtopics at any depth.
- **Topic key**: its folder path, e.g. `residencias/internet`. It's also its URL: `/temas/residencias/internet/`.
- **Update**: a dated entry in a topic's timeline (meeting, letter, response, assembly, note).
- **Assembly**: an announced or held assembly, linked to the topics it covered.
- **Event**: an activity organized or shared by FEYT (academic, cultural, sports, workshop, volunteering, social). Events live outside the tree, but can link to related topics.
- **Data vs. text**: data (status, dates, documents) is written **once**, in `topic.yaml` or in the `.es.md` file. English files **only translate text**. Spanish is required and English is optional; when English is missing, the Spanish text is shown with a notice.

## Creating a topic or subtopic

Create a folder inside the parent topic (or directly in `src/content/topics/` for a new area) containing the files below.

**`topic.yaml`**

```yaml
# status: reported | in-progress | awaiting-response | stalled | resolved
# (leave it out if the topic only groups subtopics, like an area)
status: reported
# priority: low | medium | high | critical (default: medium)
priority: high
# position among its siblings (lowest first)
order: 1
created: 2026-09-26
tags: [agua]
# optional
documents:
  - title: Oficio a Infraestructura
    # or `url: https://...` instead of `file`
    file: /docs/residencias/cortes-de-agua/oficio-01.pdf
    date: 2026-09-26
    # letter | minutes | response | photo | report | other
    type: letter
# optional: social media posts
links:
  # instagram | facebook | tiktok | x | whatsapp | web | other
  - platform: instagram
    url: https://www.instagram.com/p/XXXX/
    title: Comunicado
```

**`es.md`** (required)

```markdown
---
title: Cortes de agua
summary: Una frase que explique el problema.
---

Full description in Markdown (in Spanish).
```

**`en.md`** (optional): same format, with the translated text.

Rules:

- Use lowercase and hyphens in folder names (`cortes-de-agua`), since they become the URL.
- `updates` is a reserved name.
- **Don't rename or move folders casually**: the key changes and shared links break. If you have to, add a redirect in `public/_redirects`.

## Recording an update

Create `updates/YYYY-MM-DD-short-description.es.md` inside the topic's folder:

```markdown
---
title: Reunión con la Dirección de TICs
date: 2026-09-26
# meeting | letter | response | assembly | note
type: meeting
# optional: only if this update CHANGES the topic's status
status: in-progress
# optional, same format as in topic.yaml
documents: []
---

What happened, agreements, next steps.
```

If you set `status`, **also update `status` in `topic.yaml`**. The build checks that they match.

Optional translation: `YYYY-MM-DD-short-description.en.md`, with only `title` and the body.

## Recording an assembly

Create `src/content/assemblies/YYYY-MM-DD-name.es.md`:

```markdown
---
title: Asamblea de residencias
summary: Para qué se convoca.
# with time and Ecuador's time zone
date: 2026-10-08T17:00:00-05:00
place: Auditorio principal
# in-person | online | hybrid
format: in-person
# scheduled | held | cancelled
status: scheduled
# keys of the topics to be discussed
topics:
  - residencias/internet
links:
  - platform: instagram
    url: https://www.instagram.com/p/XXXX/
    title: Convocatoria
---

Agenda. After the assembly, set `status: held` and add the agreements or the minutes.
```

Optional translation: `YYYY-MM-DD-name.en.md`, with `title`, `summary` and the body.

## Recording an event or activity

Create `src/content/events/YYYY-MM-DD-name.es.md`:

```markdown
---
title: Minga de limpieza en las residencias
summary: Una frase que explique la actividad.
# academic | cultural | sports | workshop | volunteering | social | other
category: volunteering
# start, with time and Ecuador's time zone
date: 2026-10-15T09:00:00-05:00
# optional end (same day or later)
endDate: 2026-10-15T13:00:00-05:00
place: Residencias, bloque B
# in-person | online | hybrid
format: in-person
# scheduled | held | cancelled
status: scheduled
# optional: sign-up form (the button only shows while the event is scheduled)
registrationUrl: https://forms.gle/XXXX
# optional: keys of related topics
topics:
  - residencias/internet/bloque-b
---

Details: what to bring, who it's for, schedule.
```

Optional translation: `YYYY-MM-DD-name.en.md`, with `title`, `summary` and the body.

## Documents

Put documents in `public/docs/<topic-key>/` and reference them with a path starting at `/docs/...`. Before uploading, **remove sensitive personal data** (ID numbers, phone numbers, grades): everything in the repository is public.

## Before opening the PR

```bash
pnpm format && pnpm check && pnpm test && pnpm build
```
