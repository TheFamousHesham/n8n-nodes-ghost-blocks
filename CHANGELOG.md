# Changelog

## 0.5.0 — 2026-05-31

**BREAKING.** Full rewrite for n8n verification compatibility (n8n Cloud installable).

### Why

`n8n-nodes-ghost-blocks@0.4.x` bundled the `ghost-blocks` library and its transitive
deps (`axios`, `cheerio`, `mime-types`, etc.) into the published artifact. n8n's
community-node sandbox forbids `fs`, `http`, `https`, `dns`, `url`, `path`,
`stream`, `util`, `process`, `setTimeout`, `setImmediate`, `globalThis`, and
`__dirname` — all of which appeared in the bundled output. Result: the package
could never pass n8n's verification scan.

### Changed

- Rewrote the node to inline the Lexical document builder (no external deps).
- All HTTP now goes through `this.helpers.httpRequest` (n8n's built-in helper).
- Auth uses `node:crypto` for the HS256 JWT.

### Removed (vs 0.4.x)

- **Image upload from local disk.** The sandbox blocks `fs`, so files can't be
  read off the runner. If you need this, stay on 0.4.x and install from npm
  directly into self-hosted n8n.
- **Auto-fetched oEmbed/OpenGraph metadata.** Bookmarks and embeds now require
  you to supply `title`, `description`, `icon`, etc. as fields on the block.
  Use an upstream HTTP Request node to fetch metadata if you need it.
- **Auto-extracted image dimensions.** Pass `width` and `height` on image
  blocks explicitly.

### Migration

- If you're on **n8n Cloud**: install 0.5.0 (this is the only version Cloud
  can install).
- If you're **self-hosted** and want the heavy features: pin
  `n8n-nodes-ghost-blocks@^0.4.0` in your n8n's `package.json` and install
  directly from npm.

## 0.4.x

Bundled `ghost-blocks` library. Self-hosted only.
