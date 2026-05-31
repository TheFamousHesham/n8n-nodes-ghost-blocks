// n8n-nodes-ghost-blocks — verified-compatible Ghost CMS publishing node.
// Uses only `node:crypto` and n8n's http helpers (no fs, no fetch, no deps).

import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

import { generateGhostJwt } from './auth';
import { buildLexicalDocument, ContentBlock } from './lexical-builder';

interface GhostCredentials {
	url: string;
	adminKey: string;
	apiVersion?: string;
}

type CallGhost = (
	method: string,
	endpoint: string,
	opts?: { body?: IDataObject; query?: Record<string, string | number | undefined> },
) => Promise<IDataObject>;

export class GhostBlocks implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Ghost Blocks',
		name: 'ghostBlocks',
		icon: 'file:ghost.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Publish to Ghost CMS using simple content blocks',
		defaults: { name: 'Ghost Blocks' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'ghostBlocksApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				// Alphabetical order required by n8n verification
				options: [
					{ name: 'Health', value: 'health' },
					{ name: 'Newsletter', value: 'newsletter' },
					{ name: 'Post', value: 'post' },
					{ name: 'Tag', value: 'tag' },
				],
				default: 'post',
			},

			// ----- Post operations -----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['post'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a post' },
					{ name: 'Delete', value: 'delete', action: 'Delete a post' },
					{ name: 'Get', value: 'get', action: 'Get a post' },
					{ name: 'Get Many', value: 'list', action: 'Get many posts' },
					{ name: 'Update', value: 'update', action: 'Update a post' },
				],
				default: 'create',
			},

			{
				displayName: 'Post ID',
				name: 'postId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['post'], operation: ['get', 'update', 'delete'] } },
			},

			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['post'], operation: ['create'] } },
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['post'], operation: ['update'] } },
			},

			{
				displayName:
					'Using an AI agent? Copy the <a href="https://github.com/TheFamousHesham/n8n-nodes-ghost-blocks#ai-agent-system-prompt" target="_blank">system prompt template</a> from the repo for the content blocks schema',
				name: 'aiResourceLinks',
				type: 'notice',
				default: '',
				displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
			},

			{
				displayName: 'Content',
				name: 'content',
				type: 'json',
				default: '={{ $json.blocks }}',
				description: 'JSON array of typed content blocks. Wire from an upstream node via {{ $JSON.blocks }}.',
				displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
			},

			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
				// Alphabetical order required by n8n verification
				options: [
					{
						displayName: 'Authors',
						name: 'authors',
						type: 'string',
						default: '',
						description: 'Comma-separated author emails',
					},
					{
						displayName: 'Canonical URL',
						name: 'canonical_url',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Email Only',
						name: 'email_only',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Excerpt',
						name: 'excerpt',
						type: 'string',
						typeOptions: { rows: 2 },
						default: '',
					},
					{
						displayName: 'Feature Image Alt',
						name: 'feature_image_alt',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Feature Image Caption',
						name: 'feature_image_caption',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Feature Image URL',
						name: 'feature_image',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Featured',
						name: 'featured',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Published At',
						name: 'published_at',
						type: 'dateTime',
						default: '',
						description: 'ISO 8601 datetime. Required for status=scheduled.',
					},
					{
						displayName: 'Slug',
						name: 'slug',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						// Alphabetical
						options: [
							{ name: 'Draft', value: 'draft' },
							{ name: 'Published', value: 'published' },
							{ name: 'Scheduled', value: 'scheduled' },
						],
						default: 'draft',
					},
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'string',
						default: '',
						description: 'Comma-separated tag names. Tags prefixed with # are internal.',
					},
					{
						displayName: 'Visibility',
						name: 'visibility',
						type: 'options',
						options: [
							{ name: 'Members', value: 'members' },
							{ name: 'Paid', value: 'paid' },
							{ name: 'Public', value: 'public' },
						],
						default: 'public',
					},
				],
			},

			{
				displayName: 'SEO Fields',
				name: 'seo',
				type: 'collection',
				placeholder: 'Add SEO Field',
				default: {},
				displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
				// Alphabetical order
				options: [
					{ displayName: 'Meta Description', name: 'meta_description', type: 'string', typeOptions: { rows: 2 }, default: '' },
					{ displayName: 'Meta Title', name: 'meta_title', type: 'string', default: '' },
					{ displayName: 'OG Description', name: 'og_description', type: 'string', typeOptions: { rows: 2 }, default: '' },
					{ displayName: 'OG Image URL', name: 'og_image', type: 'string', default: '' },
					{ displayName: 'OG Title', name: 'og_title', type: 'string', default: '' },
					{ displayName: 'Twitter Description', name: 'twitter_description', type: 'string', typeOptions: { rows: 2 }, default: '' },
					{ displayName: 'Twitter Image URL', name: 'twitter_image', type: 'string', default: '' },
					{ displayName: 'Twitter Title', name: 'twitter_title', type: 'string', default: '' },
				],
			},

			{
				displayName: 'Send as Newsletter',
				name: 'newsletter',
				type: 'collection',
				placeholder: 'Configure Newsletter',
				default: {},
				displayOptions: { show: { resource: ['post'], operation: ['create', 'update'] } },
				options: [
					{ displayName: 'Newsletter Slug', name: 'slug', type: 'string', default: '' },
					{ displayName: 'Segment', name: 'segment', type: 'string', default: '' },
					{ displayName: 'Send', name: 'send', type: 'boolean', default: false },
				],
			},

			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['post'], operation: ['list'] } },
				// Alphabetical
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 50,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Order',
						name: 'order',
						type: 'string',
						default: 'published_at desc',
					},
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						default: 1,
					},
					{
						displayName: 'Search (Title Contains)',
						name: 'search',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{ name: 'Draft', value: 'draft' },
							{ name: 'Published', value: 'published' },
							{ name: 'Scheduled', value: 'scheduled' },
							{ name: 'Sent', value: 'sent' },
						],
						default: 'published',
					},
					{ displayName: 'Tag', name: 'tag', type: 'string', default: '' },
				],
			},

			// ----- Other resource operations -----
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['tag'] } },
				options: [{ name: 'Get Many', value: 'list', action: 'Get many tags' }],
				default: 'list',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['newsletter'] } },
				options: [{ name: 'Get Many', value: 'list', action: 'Get many newsletters' }],
				default: 'list',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['health'] } },
				options: [{ name: 'Test Connection', value: 'test', action: 'Test the connection' }],
				default: 'test',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const creds = (await this.getCredentials('ghostBlocksApi')) as unknown as GhostCredentials;
		const baseUrl = `${creds.url.replace(/\/+$/, '')}/ghost/api/admin`;
		const apiVersion = creds.apiVersion || 'v5.0';

		const callGhost: CallGhost = async (method, endpoint, opts = {}) => {
			const token = generateGhostJwt(creds.adminKey);
			const qs: Record<string, string | number> = {};
			if (opts.query) {
				for (const [k, v] of Object.entries(opts.query)) {
					if (v != null) qs[k] = v;
				}
			}
			return this.helpers.httpRequest({
				method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
				url: `${baseUrl}/${endpoint.replace(/^\/+/, '')}`,
				headers: {
					Authorization: `Ghost ${token}`,
					'Accept-Version': apiVersion,
					'Content-Type': 'application/json',
				},
				body: opts.body,
				qs,
				json: true,
			}) as Promise<IDataObject>;
		};

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			try {
				let result: unknown;

				if (resource === 'post') {
					result = await runPostOperation.call(this, callGhost, operation, i);
				} else if (resource === 'tag' && operation === 'list') {
					const res = await callGhost('GET', 'tags/', {
						query: { limit: 'all', include: 'count.posts' },
					});
					const tags = (res.tags as IDataObject[]) || [];
					result = tags.map((t) => ({
						id: t.id,
						name: t.name,
						slug: t.slug,
						description: t.description,
						visibility: t.visibility,
						post_count: (t.count as IDataObject)?.posts,
					}));
				} else if (resource === 'newsletter' && operation === 'list') {
					const res = await callGhost('GET', 'newsletters/');
					const newsletters = (res.newsletters as IDataObject[]) || [];
					result = newsletters.map((n) => ({
						id: n.id,
						name: n.name,
						slug: n.slug,
						status: n.status,
						sender_name: n.sender_name,
						sender_email: n.sender_email,
					}));
				} else if (resource === 'health' && operation === 'test') {
					const site = await callGhost('GET', 'site/');
					result = { ok: true, site };
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unknown operation: ${resource}.${operation}`,
						{ itemIndex: i },
					);
				}

				if (Array.isArray(result)) {
					for (const item of result) {
						returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
					}
				} else {
					returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const message = error instanceof Error ? error.message : String(error);
					returnData.push({
						json: { error: message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}
		return [returnData];
	}
}

// ----------------------------------------------------------------------------

async function runPostOperation(
	this: IExecuteFunctions,
	callGhost: CallGhost,
	operation: string,
	itemIndex: number,
): Promise<unknown> {
	if (operation === 'create' || operation === 'update') {
		const postData = buildPostPayload.call(this, itemIndex);
		const queryParams = buildQueryParams.call(this, itemIndex);

		if (operation === 'create') {
			const res = await callGhost('POST', 'posts/', {
				body: { posts: [postData] },
				query: queryParams,
			});
			return summarizePost((res.posts as IDataObject[])[0]);
		}

		const postId = this.getNodeParameter('postId', itemIndex) as string;
		// GET first to retrieve updated_at — required for PUT (collision detection)
		const existing = await callGhost('GET', `posts/${postId}/`, {
			query: { formats: 'html,lexical', include: 'tags,authors' },
		});
		postData.updated_at = (existing.posts as IDataObject[])[0].updated_at;
		const res = await callGhost('PUT', `posts/${postId}/`, {
			body: { posts: [postData] },
			query: queryParams,
		});
		return summarizePost((res.posts as IDataObject[])[0]);
	}

	if (operation === 'get') {
		const postId = this.getNodeParameter('postId', itemIndex) as string;
		const res = await callGhost('GET', `posts/${postId}/`, {
			query: { formats: 'html,lexical', include: 'tags,authors' },
		});
		return (res.posts as IDataObject[])[0];
	}

	if (operation === 'list') {
		const filters = this.getNodeParameter('filters', itemIndex, {}) as Record<string, unknown>;
		const filterParts: string[] = [];
		if (filters.status) filterParts.push(`status:${filters.status as string}`);
		if (filters.tag) filterParts.push(`tag:${filters.tag as string}`);
		if (filters.search)
			filterParts.push(`title:~'${(filters.search as string).replace(/'/g, "\\'")}'`);
		const query: Record<string, string | number> = {
			formats: 'html,lexical',
			include: 'tags,authors',
		};
		if (filterParts.length > 0) query.filter = filterParts.join('+');
		if (filters.limit) query.limit = filters.limit as number;
		if (filters.page) query.page = filters.page as number;
		if (filters.order) query.order = filters.order as string;

		const res = await callGhost('GET', 'posts/', { query });
		return (res.posts as IDataObject[]).map(summarizePost);
	}

	if (operation === 'delete') {
		const postId = this.getNodeParameter('postId', itemIndex) as string;
		await callGhost('DELETE', `posts/${postId}/`);
		return { id: postId, deleted: true };
	}

	throw new NodeOperationError(this.getNode(), `Unknown post operation: ${operation}`, {
		itemIndex,
	});
}

function buildPostPayload(this: IExecuteFunctions, itemIndex: number): IDataObject {
	const title = this.getNodeParameter('title', itemIndex, '') as string;
	const contentParam = this.getNodeParameter('content', itemIndex, '') as string | unknown[];
	const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as Record<
		string,
		unknown
	>;
	const seo = this.getNodeParameter('seo', itemIndex, {}) as Record<string, unknown>;

	let content: ContentBlock[] | undefined;
	if (typeof contentParam === 'string') {
		if (contentParam.trim()) {
			try {
				content = JSON.parse(contentParam);
			} catch (e) {
				throw new NodeOperationError(
					this.getNode(),
					`Could not parse Content as JSON: ${(e as Error).message}`,
					{ itemIndex },
				);
			}
		}
	} else if (Array.isArray(contentParam)) {
		content = contentParam as ContentBlock[];
	}

	const postData: IDataObject = {};
	if (title) postData.title = title;
	if (content && content.length > 0) postData.lexical = buildLexicalDocument(content);

	const passthroughKeys = [
		'status',
		'visibility',
		'featured',
		'slug',
		'feature_image',
		'feature_image_alt',
		'feature_image_caption',
		'canonical_url',
		'email_only',
		'published_at',
	];
	for (const k of passthroughKeys) {
		if (additionalFields[k] !== undefined && additionalFields[k] !== '') {
			postData[k] = additionalFields[k] as IDataObject[string];
		}
	}
	if (additionalFields.excerpt) postData.custom_excerpt = additionalFields.excerpt as string;

	if (typeof additionalFields.tags === 'string' && additionalFields.tags) {
		postData.tags = (additionalFields.tags as string)
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map((name) => ({ name }));
	}
	if (typeof additionalFields.authors === 'string' && additionalFields.authors) {
		postData.authors = (additionalFields.authors as string)
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map((email) => ({ email }));
	}

	if (Object.keys(seo).length > 0) {
		const seoKeys = [
			'meta_title',
			'meta_description',
			'og_title',
			'og_description',
			'og_image',
			'twitter_title',
			'twitter_description',
			'twitter_image',
		];
		for (const k of seoKeys) {
			if (seo[k]) postData[k] = seo[k] as string;
		}
	}

	return postData;
}

function buildQueryParams(this: IExecuteFunctions, itemIndex: number): Record<string, string> {
	const newsletter = this.getNodeParameter('newsletter', itemIndex, {}) as Record<string, unknown>;
	const queryParams: Record<string, string> = {};
	if (newsletter.send && newsletter.slug) {
		queryParams.newsletter = newsletter.slug as string;
		if (newsletter.segment) queryParams.email_segment = newsletter.segment as string;
	}
	return queryParams;
}

function summarizePost(post: IDataObject): IDataObject {
	return {
		id: post.id,
		uuid: post.uuid,
		url: post.url,
		status: post.status,
		title: post.title,
		slug: post.slug,
		created_at: post.created_at,
		updated_at: post.updated_at,
		published_at: post.published_at,
	};
}
