import {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

import { generateGhostJwt } from '../nodes/GhostBlocks/auth';

// Ghost's Admin API uses short-lived HS256 JWTs computed from the admin key.
// `preAuthentication` runs before every request, generates a fresh token from
// the credentials, and injects it into `$credentials.sessionToken` — which the
// `authenticate` block then puts on the Authorization header. The static `test`
// request hits /admin/site/, which exercises the full auth flow.
export class GhostBlocksApi implements ICredentialType {
	name = 'ghostBlocksApi';
	displayName = 'Ghost Blocks API';
	documentationUrl =
		'https://github.com/TheFamousHesham/n8n-nodes-ghost-blocks#authentication';
	icon: Icon = 'file:ghost.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Ghost URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'https://my-site.ghost.io',
			required: true,
			description:
				'Your Ghost site URL (without trailing slash). The Admin API is at {url}/ghost/api/admin/.',
		},
		{
			displayName: 'Admin API Key',
			name: 'adminKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Ghost Admin API key in the format "{id}:{secret}". Create one in Ghost Admin → Settings → Integrations → Add custom integration.',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: 'v5.0',
			description: 'Ghost Admin API version to target. Most users should leave this as v5.0.',
		},
		// Internal field populated by preAuthentication. Hidden from the UI.
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			typeOptions: { password: true },
			default: '',
		},
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<{ sessionToken: string }> {
		const adminKey = (credentials.adminKey as string) || '';
		const sessionToken = generateGhostJwt(adminKey);
		return { sessionToken };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Ghost {{$credentials.sessionToken}}',
				'Accept-Version': '={{$credentials.apiVersion || "v5.0"}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url.replace(/\\/+$/, "")}}',
			url: '/ghost/api/admin/site/',
			method: 'GET',
		},
	};
}
