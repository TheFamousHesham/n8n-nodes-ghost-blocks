# n8n-nodes-ghost-blocks

[![npm version](https://img.shields.io/npm/v/n8n-nodes-ghost-blocks.svg)](https://www.npmjs.com/package/n8n-nodes-ghost-blocks)
[![License](https://img.shields.io/npm/l/n8n-nodes-ghost-blocks.svg)](../../LICENSE)

**n8n community node for publishing to Ghost CMS — slim, sandbox-compliant edition for [n8n Cloud](https://n8n.io/cloud/) (verified).**

## Two versions, one workflow

This package exists alongside [`n8n-nodes-ghost-blocks`](https://www.npmjs.com/package/n8n-nodes-ghost-blocks). Pick the one that fits your n8n deployment:

| You are on… | Use | Why |
|---|---|---|
| **n8n Cloud** (managed) | **`n8n-nodes-ghost-blocks`** (this package) | Verified community node — installable via the in-app UI |
| **Self-hosted n8n** | [`n8n-nodes-ghost-blocks`](https://www.npmjs.com/package/n8n-nodes-ghost-blocks) | Full features: image upload, bookmark/embed auto-enrichment, oEmbed and OpenGraph fetching |

Both versions share the same content blocks format — you can move workflows between them as long as you don't use the features marked below.

## What you get

✅ Create / Update / Get / List / Delete posts
✅ All 24 content block types (paragraph, heading, image, callout, signup, paywall, etc.)
✅ Inline markdown in paragraph/heading/quote
✅ SEO fields, scheduling, tags, authors, custom slugs
✅ Newsletter delivery on publish
✅ Tag and newsletter listing
✅ Health check

## What's not in this version

These features require Node APIs that n8n Cloud's community-node sandbox doesn't allow. Use the [self-hosted version](https://www.npmjs.com/package/n8n-nodes-ghost-blocks) if you need them:

❌ Image upload (uses `node:fs`)
❌ Bookmark auto-enrichment via OpenGraph (uses HTTP fetch + DNS)
❌ Embed auto-enrichment via oEmbed (uses HTTP fetch)
❌ SSRF protection via DNS resolution

In this version, `bookmark` blocks need `title`/`description`/etc. provided in the JSON. `embed` blocks just store the URL — the host n8n's HTTP Request node can pre-fetch oEmbed if you need the iframe HTML.

## Installation

In your n8n Cloud instance:

1. **Settings → Community Nodes → Install**
2. Enter the package name: `n8n-nodes-ghost-blocks`
3. Click **Install**

## Setup

### Get your Ghost Admin API key

1. In Ghost Admin: **Settings → Integrations → Add custom integration**
2. Copy the **Admin API Key** — format: `61234abc:f1f2f3...d4d5d6`

### Configure credentials in n8n

Add a new **Ghost Blocks API** credential:

| Field | Value |
|---|---|
| Ghost URL | `https://my-site.ghost.io` (no trailing slash) |
| Admin API Key | The full `id:secret` key from Ghost |
| API Version | `v5.0` (default) |

### Test the connection

Add a **Ghost Blocks** node, Resource = **Health**, Operation = **Test Connection**. You should see your site info returned.

## Using with an AI agent

The content schema is shared with the full version. Use these resources to teach your AI agent the format:

- **[AI agent system prompt template](https://github.com/TheFamousHesham/ghost-blocks/blob/master/packages/core/schema/ai-prompt.md)** — copy-paste into your agent's system message.
- **[JSON Schema](https://github.com/TheFamousHesham/ghost-blocks/blob/master/packages/core/schema/blocks.schema.json)** — for strict structured-output validation with OpenAI `response_format` or Anthropic `tool_use`.

## More tools for n8n users

- **[Nodey](https://getnodey.com)** *(launching soon)* — Mobile command centre for n8n. Run and debug workflows from your phone, with an AI workflow builder, geo-fenced location triggers, and NFC triggers.
- **[n8n workflow templates](https://github.com/TheFamousHesham/n8n_workflows)** — Production-ready n8n workflow templates.

## License

MIT
