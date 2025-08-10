import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CallistoNetworkApi implements ICredentialType {
	name = 'callistoNetworkApi';
	displayName = 'Callisto Network API';
	documentationUrl = 'https://docs.callisto.network/';
	properties: INodeProperties[] = [
		{
			displayName: 'RPC URL',
			name: 'rpcUrl',
			type: 'string',
			default: 'https://rpc.callisto.network/',
			description: 'The RPC URL for Callisto Network',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Needed sometime',
		},
		{
			displayName: 'Explorer URL',
			name: 'explorerUrl',
			type: 'string',
			default: 'https://explorer.callisto.network/',
			description: 'The block explorer URL for transaction verification',
		},
	];
}
