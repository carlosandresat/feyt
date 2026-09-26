# FEYT · Student issues

Website of the **Federación de Estudiantes de Yachay Tech** (Yachay Tech Student Federation) for following the student issues FEYT works on. Issues are shown as a navigable tree (e.g. Residencias → Internet → Bloque B), each with:

- its status;
- a timeline of the work done;
- supporting documents;
- the assemblies where it was discussed.

The site is in Spanish, with an English version.

- **Stack:** [Astro](https://docs.astro.build) (static site), content as Markdown/YAML in the repo, search with [Pagefind](https://pagefind.app), hosting on Cloudflare Workers (static assets).
- **Publishing content:** see [CONTRIBUTING.md](CONTRIBUTING.md). Every change goes through a Pull Request.

## Development

Requires Node 22.12+ and pnpm.

```bash
pnpm install
pnpm dev             # http://localhost:4321
pnpm build           # astro build + search index (Pagefind) in dist/
pnpm preview         # serves dist/ (search works here)
pnpm check           # types (astro check)
pnpm test            # Vitest
pnpm format          # Prettier
```

## Deployment (Cloudflare)

The site is built into `dist/` and Cloudflare serves it as static files (config in `wrangler.jsonc`). To connect it:

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Import a repository** and pick this repo.
2. Build command: `pnpm build`. Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`).
3. Enable builds for non-production branches, so every PR gets a preview URL.

   Dashboard labels may change; see the [Astro on Cloudflare Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/).

## Roadmap

- **Phase 1 (current):** static informational site.
- **Phase 2:** participation (opinions, signing up to help with an issue) with login restricted to `@yachaytech.edu.ec`. Planned approach:
  - `@astrojs/cloudflare` adapter, used only for the dynamic routes;
  - Cloudflare D1 + Drizzle for storage;
  - user data linked to each topic by its stable key, while official content stays in Git.

> The content currently in `src/content/` is **sample data**. Replace it with real information before publishing.
