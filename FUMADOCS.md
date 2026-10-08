# Fumadocs Site

The public site contains only Vietnamese translations. Chinese Markdown files at the repository root and under `Volume2/` remain the translation source of truth and are not published.

## Local Development

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000/docs>.

## Content Flow

Translation workers write complete documents under `vi/`, following `translation/RULE.md`:

- `vi/README.md` becomes the site landing page when present;
- `vi/CHAPTER *.md` becomes a Volume 1 page;
- `vi/Volume2/CHAPTER *.md` becomes a Volume 2 page;
- untranslated documents are not published.

`pnpm content:sync` generates the ignored `content/docs/` tree, normalizes Fumadocs metadata and routes image references to `/images/`. `pnpm build` runs this sync automatically before the production build.

## Checks

```bash
pnpm content:sync
pnpm types:check
pnpm build
```
