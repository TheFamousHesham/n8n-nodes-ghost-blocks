import { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

// Ghost's Admin API uses short-lived JWTs (HS256 with hex-decoded secret),
// so we use a dynamic credential test (implemented on the node) instead of
// the static ICredentialTestRequest helper.
export class GhostBlocksApi implements ICredentialType {
	name = 'ghostBlocksApi';
	displayName = 'Ghost Blocks API';
	documentationUrl =
		'https://github.com/TheFamousHesham/n8n-nodes-ghost-blocks#authentication';
	icon: Icon = 'file:ghost.svg';

	testedBy = 'ghostBlocksApiTest';

	properties: INodeProperties[] = [
		{
			displayName: 'Ghost URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'https://my-site.ghost.io',
			required: true,
			description:
				'Your Ghost site URL (without trailing slash). The Admin API is at {url}/ghost/api/admin/',
		},
		{
			displayName: 'Admin API Key',
			name: 'adminKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Ghost Admin API key in the format "{id}:{secret}". Create one in Ghost Admin → Settings → Integrations → Add custom integration',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: 'v5.0',
			description: 'Ghost Admin API version to target. Most users should leave this as v5.0',
		},
	];
}
