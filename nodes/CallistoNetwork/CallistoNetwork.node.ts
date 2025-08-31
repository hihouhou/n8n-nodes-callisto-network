import {
        IExecuteFunctions,
        INodeExecutionData,
        INodeType,
        INodeTypeDescription,
        NodeOperationError,
        NodeConnectionType,
} from 'n8n-workflow';

import { ethers } from 'ethers';

import fetch from 'node-fetch';

export class CallistoNetwork implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'Callisto Network DAO',
                name: 'callistoNetworkDao',
                icon: 'file:CallistoNetwork.svg',
                group: ['blockchain'],
                version: 1,
                subtitle: '={{$parameter["operation"]}}',
                description: 'Manage voting, claims and rewards on Callisto Network DAO',
                defaults: {
                        name: 'Callisto Network DAO',
                },
                inputs: [NodeConnectionType.Main],
                outputs: [NodeConnectionType.Main],
                credentials: [
                        {
                                name: 'callistoNetworkApi',
                                required: false,
                        },
                ],
                properties: [
                        {
                                displayName: 'Operation',
                                name: 'operation',
                                type: 'options',
                                noDataExpression: true,
                                options: [
                                        {
                                                name: 'Check DAO Claims',
                                                value: 'checkDaoClaims',
                                                description: 'Check available claims for a wallet',
                                                action: 'Check claims for a wallet',
                                        },
                                        {
                                                name: 'Execute DAO Claim',
                                                value: 'executeAllDaoClaims',
                                                description: 'Execute a DAO claim transaction',
                                                action: 'Execute a DAO claim transaction',
                                        },
                                        {
                                                name: 'Vote on Proposal',
                                                value: 'voteOnProposal',
                                                description: 'Vote on a DAO proposal',
                                                action: 'Vote on a DAO proposal',
                                        },
                                        {
                                                name: 'Get Active Proposals DAO',
                                                value: 'getActiveProposalsDao',
                                                description: 'Get list of active proposals',
                                                action: 'Get active proposals',
                                        },
                                        {
                                                name: 'Get Proposal Details',
                                                value: 'getProposalDetails',
                                                description: 'Get detailed information about a proposal',
                                                action: 'Get proposal details',
                                        },
                                        {
                                                name: 'Get Vote History',
                                                value: 'getVoteHistory',
                                                description: 'Get voting history for a wallet',
                                                action: 'Get voting history for a wallet',
                                        },
                                        {
                                                name: 'Get Wallet Balance',
                                                value: 'getBalance',
                                                description: 'Get CLO balance of a wallet',
                                                action: 'Get wallet balance',
                                        },
                                        {
                                                name: 'Send CLO',
                                                value: 'sendCLO',
                                                description: 'Send CLO tokens to another wallet',
                                                action: 'Send CLO tokens to another wallet',
                                        },
                                        {
                                                name: 'List Available Proposal IDs',
                                                value: 'listProposalIds',
                                                description: 'Get list of all available proposal IDs',
                                                action: 'Get available proposal IDs',
                                        },
                                        {
                                                name: 'Check Cold Staking Rewards',
                                                value: 'checkColdStakingRewards',
                                                description: 'Check available cold staking rewards for a wallet',
                                                action: 'Check cold staking rewards',
                                        },
                                        {
                                                name: 'Claim Cold Staking Rewards',
                                                value: 'claimColdStakingRewards',
                                                description: 'Claim available cold staking rewards',
                                                action: 'Claim cold staking rewards',
                                        },
                                        {
                                                name: 'Withdraw Cold Staking Rewards',
                                                value: 'withdrawColdStakingRewards',
                                                description: 'Withdraw available cold staking rewards',
                                                action: 'Withdraw cold staking rewards',
                                        },
                                        {
                                                name: 'Start Cold Staking',
                                                value: 'startColdStaking',
                                                description: 'Start cold staking',
                                                action: 'Start cold staking',
                                        },
					{
						name: 'Create Order',
						value: 'createOrder',
						description: 'Create a new order on 2Bears',
						action: 'Create a new order on 2Bears',
					},
					{
						name: 'Cancel Order',
						value: 'cancelOrder',
						description: 'Cancel an existing order on 2Bears',
						action: 'Cancel an existing order on 2Bears',
					},
					{
						name: 'Get Open Orders',
						value: 'getOpenOrders',
						description: 'Get a list of open orders for a wallet on 2Bears',
						action: 'Get a list of open orders for a wallet on 2Bears',
					},
					{
						name: 'Get Order Book',
						value: 'getOrderBook',
						description: 'Get the order book for a token pair on 2Bears',
						action: 'Get the order book for a token pair on 2Bears',
					},
					{
						name: 'Get last Block Number',
						value: 'getLatestBlockNumber',
						description: 'Get the last block number',
						action: 'Get the last block number',
					},
					{
						name: 'Scan block for Addresses',
						value: 'scanBlocksForAddresses',
						description: 'Scan blocks for specific addresses',
						action: 'Scan block and create event when found addresses',
					},
                                ],
                                default: 'getActiveProposalsDao',
                        },
                        {
                                displayName: 'Wallet Address',
                                name: 'walletAddress',
                                type: 'string',
                                required: true,
                                default: '',
                                placeholder: '0x742d35Cc6634C0532925a3b8D36c4C5c6C69c3c5',
                                description: 'The wallet address',
                        },
                        {
                                displayName: 'Only Trigger on Balance Change',
                                name: 'onlyOnChange',
                                type: 'boolean',
                                default: true,
                                description: 'Whether to only output data when the wallet balance changes',
                                displayOptions: {
                                        show: {
                                                operation: ['getBalance'],
                                        },
                                },
                        },
                        {
                                displayName: 'RPC URL',
                                name: 'rpcUrl',
                                type: 'string',
                                default: 'https://rpc.callistodao.org/',
                                description: 'Callisto Network RPC endpoint',
                        },
                        {
                                displayName: 'Contract Address',
                                name: 'contractAddress',
                                type: 'string',
                                displayOptions: {
                                        show: {
                                                operation: ['checkDaoClaims', 'executeAllDaoClaims', 'getVoteHistory', 'voteOnProposal', 'getActiveProposalsDao', 'getProposalDetails', 'getVotingPower', 'listProposalIds'],
                                        },
                                },
                                default: '0x810059e1406dEDAFd1BdCa4E0137CbA306c0Ce36',
                                placeholder: '0x810059e1406dEDAFd1BdCa4E0137CbA306c0Ce36',
                                description: 'The address of the DAO contract',
                        },
                        {
                                displayName: 'Cold Staking Contract Address',
                                name: 'coldStakingContractAddress',
                                type: 'string',
                                displayOptions: {
                                        show: {
                                                operation: ['checkColdStakingRewards', 'claimColdStakingRewards', 'getColdStakingInfo', 'listenColdStakingEvents', 'startColdStaking', 'withdrawColdStakingRewards'],
                                        },
                                },
                                default: '0x08A7c8be47773546DC5E173d67B0c38AfFfa4b84',
                                placeholder: '0x...',
                                description: 'The address of the Cold Staking contract',
                        },
                        {
                                displayName: '2Bears Order Contract Address',
                                name: 'twoBearsOrderContractAddress',
                                type: 'string',
                                displayOptions: {
                                        show: {
                                                operation: ['createOrder', 'cancelOrder', 'getOpenOrders', 'getOrderBook'],
                                        },
                                },
                                default: '0x1635a5bBf111742f7eBB95950714494a17FC14cb',
                                placeholder: '0x...',
                                description: 'The address of the 2Bears Order contract',
                        },
                        {
                                displayName: 'Recipient Address',
                                name: 'recipientAddress',
                                type: 'string',
                                displayOptions: {
                                        show: {
                                                operation: ['sendCLO'],
                                        },
                                },
                                required: true,
                                default: '',
                                placeholder: '0x742d35Cc6634C0532925a3b8D36c4C5c6C69c3c5',
                                description: 'The recipient wallet address',
                        },
                        {
                                displayName: 'Amount (CLO)',
                                name: 'amount',
                                type: 'string',
                                displayOptions: {
                                        show: {
                                                operation: ['sendCLO', 'startColdStaking'],
                                        },
                                },
                                required: true,
                                default: '',
                                placeholder: '1.5',
                                description: 'Amount of CLO to send (e.g., 1.5 for 1.5 CLO)',
                        },
                        {
                                displayName: 'Proposal ID',
                                name: 'proposalId',
                                type: 'string',
                                displayOptions: {
                                        show: {
                                                operation: ['voteOnProposal', 'getProposalDetails'],
                                        },
                                },
                                default: '',
                                placeholder: '1',
                                description: 'The ID of the proposal',
                        },
                        {
                                displayName: 'Vote Choice',
                                name: 'voteChoice',
                                type: 'options',
                                displayOptions: {
                                        show: {
                                                operation: ['voteOnProposal'],
                                        },
                                },
                                options: [
                                        {
                                                name: 'No (false)',
                                                value: 'false',
                                                description: 'Vote against the proposal',
                                        },
                                        {
                                                name: 'Yes (true)',
                                                value: 'true',
                                                description: 'Vote in favor of the proposal',
                                        },
                                ],
                                default: 'true',
                                description: 'Your vote choice',
                        },
                        {
                                displayName: 'Gas Limit',
                                name: 'gasLimit',
                                type: 'number',
                                displayOptions: {
                                        show: {
                                                operation: ['executeAllDaoClaims', 'voteOnProposal', 'sendCLO', 'claimColdStakingRewards', 'createOrder', 'startColdStaking', 'withdrawColdStakingRewards'],
                                        },
                                },
                                default: 210000,
                                description: 'Gas limit for the transaction',
                        },
                        {
                                displayName: 'Gas Price (Gwei)',
                                name: 'gasPrice',
                                type: 'number',
                                displayOptions: {
                                        show: {
                                                operation: ['executeAllDaoClaims', 'voteOnProposal', 'sendCLO', 'claimColdStakingRewards', 'createOrder', 'startColdStaking', 'withdrawColdStakingRewards'],
                                        },
                                },
                                default: 1001,
                                description: 'Gas price in Gwei',
                        },
			{
				displayName: 'Token In',
				name: 'tokenIn',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder', 'getOrderBook', 'getOpenOrders'],
					},
				},
				default: '',
				placeholder: '0x...',
				description: 'The address of the token you are selling',
			},
			{
				displayName: 'Token Out',
				name: 'tokenOut',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['createOrder', 'getOrderBook', 'getOpenOrders'],
					},
				},
				default: '',
				placeholder: '0x...',
				description: 'The address of the token you are buying',
			},
			{
				displayName: 'Amount To Sell',
				name: 'amountIn',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: 0,
				description: 'The amount of tokens you are selling',
			},
			{
				displayName: 'Amount To Buy',
				name: 'amountOut',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: 0,
				description: 'The amount of tokens you are buying',
			},
			{
				displayName: 'Price',
				name: 'price',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				default: 0,
				description: 'The price of the order',
			},
			{
				displayName: 'Order Type',
				name: 'orderType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['createOrder'],
					},
				},
				options: [
					{
						name: 'Sell',
						value: 1,
					},
					{
						name: 'Buy',
						value: 2,
					},
				],
				default: 1,
				description: 'The type of the order',
			},
			{
				displayName: 'Order IDs',
				name: 'orderIds',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['cancelOrder'],
					},
				},
				default: '',
				placeholder: '1,2,3',
				description: 'A comma-separated list of order IDs to cancel',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['getOpenOrders', 'getOrderBook'],
					},
				},
				default: 10,
				description: 'The number of orders to fetch',
			},
			{
				displayName: 'startblock',
				name: 'startBlock',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['scanBlocksForAddresses'],
					},
				},
				default: 10,
				description: 'The number of orders to fetch',
			},
			{
				displayName: 'endblock',
				name: 'endBlock',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['scanBlocksForAddresses'],
					},
				},
				default: 10,
				description: 'The number of orders to fetch',
			},
            {
                displayName: 'Watch List',
                name: 'watchList',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['scanBlocksForAddresses'],
                    },
                },
                typeOptions: {
                    multipleValues: true,
                },
                default: [],
                placeholder: '0x123..., 0x456...',
                description: 'List of wallet or contract addresses to monitor',
            },
                        {
                                displayName: 'auto fetch ABI',
                                name: 'autoFetchABI',
                                type: 'boolean',
                                default: true,
                                description: 'auto fetch ABI for Callisto DAO Explorer',
                                displayOptions: {
                                        show: {
                                                operation: ['scanBlocksForAddresses'],
                                        },
                                },
                        },
                        {
                                displayName: 'Additional Options',
                                name: 'additionalOptions',
                                type: 'collection',
                                placeholder: 'Add Option',
                                default: {},
                                options: [
                                        {
                                                displayName: 'Timeout (seconds)',
                                                name: 'timeout',
                                                type: 'number',
                                                default: 30,
                                                description: 'Request timeout in seconds',
                                        },
                                        {
                                                displayName: 'Max Retries',
                                                name: 'maxRetries',
                                                type: 'number',
                                                default: 3,
                                                description: 'Maximum number of retries on failure',
                                        },
                                        {
                                                displayName: 'Include Raw Data',
                                                name: 'includeRawData',
                                                type: 'boolean',
                                                default: false,
                                                description: 'Include raw blockchain data in response',
                                        },
                                        {
                                                displayName: 'Max Proposals',
                                                name: 'maxProposals',
                                                type: 'number',
                                                default: 20,
                                                description: 'Maximum number of proposals to fetch',
                                        },
                                ],
                        },
                ],
        };

        async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
                const items = this.getInputData();
                const returnData: INodeExecutionData[] = [];

                // Callisto Network DAO contract ABI based on your file
                const contractABI = [
                        {"type":"constructor","stateMutability":"nonpayable","inputs":[{"type":"address","name":"_firstUser","internalType":"address"},{"type":"string","name":"_name","internalType":"string"}]},
                        {"type":"event","name":"ChangeStatus","inputs":[{"type":"uint256","name":"_id","internalType":"uint256","indexed":true},{"type":"uint8","name":"_status","internalType":"uint8","indexed":false}],"anonymous":false},
                        {"type":"event","name":"Claim","inputs":[{"type":"address","name":"_sender","internalType":"address","indexed":true},{"type":"uint256","name":"_id","internalType":"uint256","indexed":true},{"type":"uint256","name":"_pay","internalType":"uint256","indexed":false}],"anonymous":false},
                        {"type":"event","name":"CreateProposal","inputs":[{"type":"uint256","name":"_id","internalType":"uint256","indexed":true},{"type":"uint256","name":"_reward","internalType":"uint256","indexed":false}],"anonymous":false},
                        {"type":"event","name":"Vote","inputs":[{"type":"address","name":"_sender","internalType":"address","indexed":true},{"type":"uint256","name":"_id","internalType":"uint256","indexed":true},{"type":"bool","name":"_answer","internalType":"bool","indexed":false}],"anonymous":false},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"addUserInDAO","inputs":[{"type":"address","name":"_user","internalType":"address"},{"type":"string","name":"_name","internalType":"string"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"checkClaim","inputs":[{"type":"uint256","name":"_id","internalType":"uint256"},{"type":"address","name":"_user","internalType":"address"}]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"claim","inputs":[{"type":"uint256","name":"_id","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"payable","outputs":[],"name":"createProposal","inputs":[{"type":"address","name":"_contract","internalType":"address"},{"type":"bytes","name":"_data","internalType":"bytes"},{"type":"string","name":"_comment","internalType":"string"}]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"delUserInDAO","inputs":[{"type":"address","name":"_user","internalType":"address"}]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"execute","inputs":[{"type":"uint256","name":"_id","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"expire_period","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"},{"type":"bool[]","name":"","internalType":"bool[]"}],"name":"getClaimList","inputs":[{"type":"address","name":"_user","internalType":"address"},{"type":"uint256","name":"_start_ID","internalType":"uint256"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct GovernanceDAO.ProposalData","components":[{"type":"uint256","name":"id","internalType":"uint256"},{"type":"uint256","name":"time","internalType":"uint256"},{"type":"uint256","name":"reward","internalType":"uint256"},{"type":"uint256","name":"deadLine","internalType":"uint256"},{"type":"address","name":"owner","internalType":"address"},{"type":"uint8","name":"status","internalType":"uint8"},{"type":"string","name":"comment","internalType":"string"},{"type":"address[]","name":"vocesYes","internalType":"address[]"},{"type":"address[]","name":"vocesNo","internalType":"address[]"},{"type":"address","name":"to","internalType":"address"},{"type":"bytes","name":"data","internalType":"bytes"}]}],"name":"getProposal","inputs":[{"type":"uint256","name":"_id","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"tuple[]","name":"","internalType":"struct GovernanceDAO.ProposalData[]","components":[{"type":"uint256","name":"id","internalType":"uint256"},{"type":"uint256","name":"time","internalType":"uint256"},{"type":"uint256","name":"reward","internalType":"uint256"},{"type":"uint256","name":"deadLine","internalType":"uint256"},{"type":"address","name":"owner","internalType":"address"},{"type":"uint8","name":"status","internalType":"uint8"},{"type":"string","name":"comment","internalType":"string"},{"type":"address[]","name":"vocesYes","internalType":"address[]"},{"type":"address[]","name":"vocesNo","internalType":"address[]"},{"type":"address","name":"to","internalType":"address"},{"type":"bytes","name":"data","internalType":"bytes"}]}],"name":"getProposalsList","inputs":[{"type":"uint256","name":"_start_ID","internalType":"uint256"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct GovernanceDAO.UserData","components":[{"type":"uint256","name":"index","internalType":"uint256"},{"type":"uint256","name":"votes","internalType":"uint256"},{"type":"uint256","name":"entered","internalType":"uint256"},{"type":"address","name":"userAddr","internalType":"address"},{"type":"string","name":"name","internalType":"string"}]}],"name":"getUser","inputs":[{"type":"address","name":"_user","internalType":"address"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"tuple[]","name":"","internalType":"struct GovernanceDAO.UserData[]","components":[{"type":"uint256","name":"index","internalType":"uint256"},{"type":"uint256","name":"votes","internalType":"uint256"},{"type":"uint256","name":"entered","internalType":"uint256"},{"type":"address","name":"userAddr","internalType":"address"},{"type":"string","name":"name","internalType":"string"}]}],"name":"getUsersList","inputs":[{"type":"uint256","name":"_start_index","internalType":"uint256"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"min_payment_DAO","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"min_payment_other","inputs":[]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setExpirePeriod","inputs":[{"type":"uint256","name":"_period","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setMinPayments","inputs":[{"type":"uint256","name":"_min_payment_DAO","internalType":"uint256"},{"type":"uint256","name":"_min_payment_other","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"total_close_voting","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"total_user","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"total_voting","inputs":[]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"vote","inputs":[{"type":"uint256","name":"_id","internalType":"uint256"},{"type":"bool","name":"_answer","internalType":"bool"}]}
                ];

                // Cold Staking ABI from your provided data
                const coldStakingABI = [
                        {"type":"event","name":"Claim","inputs":[{"type":"address","name":"staker","internalType":"address","indexed":false},{"type":"uint256","name":"reward","internalType":"uint256","indexed":false}],"anonymous":false},
                        {"type":"event","name":"DonationDeposited","inputs":[{"type":"address","name":"_address","internalType":"address","indexed":false},{"type":"uint256","name":"value","internalType":"uint256","indexed":false}],"anonymous":false},
                        {"type":"event","name":"StartStaking","inputs":[{"type":"address","name":"addr","internalType":"address","indexed":false},{"type":"uint256","name":"value","internalType":"uint256","indexed":false},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false},{"type":"uint256","name":"time","internalType":"uint256","indexed":false},{"type":"uint256","name":"end_time","internalType":"uint256","indexed":false}],"anonymous":false},
                        {"type":"event","name":"WithdrawStake","inputs":[{"type":"address","name":"staker","internalType":"address","indexed":false},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"BlockStartStaking","inputs":[]},
                        {"type":"function","stateMutability":"payable","outputs":[],"name":"DEBUG_donation","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"LastBlock","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"StakingRewardPool","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"Timestamp","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"TotalStakingAmount","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"TotalStakingWeight","inputs":[]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"claim","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"max_delay","inputs":[]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"report_abuse","inputs":[{"type":"address","name":"_addr","internalType":"address payable"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"round_interval","inputs":[]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"_reward","internalType":"uint256"}],"name":"stake_reward","inputs":[{"type":"address","name":"_addr","internalType":"address"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"amount","internalType":"uint256"},{"type":"uint256","name":"time","internalType":"uint256"},{"type":"uint256","name":"multiplier","internalType":"uint256"},{"type":"uint256","name":"end_time","internalType":"uint256"}],"name":"staker","inputs":[{"type":"address","name":"","internalType":"address"}]},
                        {"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"staking_threshold","inputs":[]},
                        {"type":"function","stateMutability":"payable","outputs":[],"name":"start_staking","inputs":[]},
                        {"type":"function","stateMutability":"payable","outputs":[],"name":"start_staking","inputs":[{"type":"uint256","name":"rounds","internalType":"uint256"}]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"withdraw_stake","inputs":[{"type":"address","name":"user","internalType":"address payable"}]},
                        {"type":"function","stateMutability":"nonpayable","outputs":[],"name":"withdraw_stake","inputs":[]},
                        {"type":"receive","stateMutability":"payable"}
                ];

		const twoBearsOrdersABI = [{"type":"event","name":"CancelOrder","inputs":[{"type":"uint256","name":"ID","internalType":"uint256","indexed":true}],"anonymous":false},{"type":"event","name":"CreateOrder","inputs":[{"type":"uint256","name":"ID","internalType":"uint256","indexed":true}],"anonymous":false},{"type":"event","name":"DeleteOrder","inputs":[{"type":"uint256","name":"ID","internalType":"uint256","indexed":true}],"anonymous":false},{"type":"event","name":"ExecutableOrder","inputs":[{"type":"uint256","name":"ID","internalType":"uint256","indexed":true}],"anonymous":false},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"cancelOrders","inputs":[{"type":"uint256[]","name":"_id_arr","internalType":"uint256[]"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"contractDeposits","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"createOrder","inputs":[{"type":"address","name":"_owner","internalType":"address"},{"type":"address","name":"_token_in","internalType":"address"},{"type":"uint256","name":"_value_in","internalType":"uint256"},{"type":"address","name":"_token_out","internalType":"address"},{"type":"uint256","name":"_value_out","internalType":"uint256"},{"type":"uint8","name":"_order_type","internalType":"uint8"},{"type":"uint256","name":"_price","internalType":"uint256"},{"type":"uint256","name":"_order_position","internalType":"uint256"},{"type":"uint256","name":"_dex_fee","internalType":"uint256"},{"type":"uint256","name":"_dex_num_exec_ord","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"deleteCloseOrders","inputs":[{"type":"uint256[]","name":"_id_arr","internalType":"uint256[]"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"deleteGlobalOrders","inputs":[{"type":"uint256[]","name":"_id_arr","internalType":"uint256[]"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"getAllOpenOrders","inputs":[{"type":"address","name":"_owner","internalType":"address"},{"type":"uint256","name":"_id","internalType":"uint256"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"getCloseOrders","inputs":[{"type":"address","name":"_token1","internalType":"address"},{"type":"address","name":"_token2","internalType":"address"},{"type":"address","name":"_owner","internalType":"address"},{"type":"uint256","name":"_id","internalType":"uint256"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"getCloseOrdersOracle","inputs":[{"type":"address","name":"_token1","internalType":"address"},{"type":"address","name":"_token2","internalType":"address"},{"type":"address","name":"_owner","internalType":"address"},{"type":"uint256","name":"_id","internalType":"uint256"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"getExecOrderBook","inputs":[{"type":"address","name":"_token1","internalType":"address"},{"type":"address","name":"_token2","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"getLockedTokensForOracle","inputs":[{"type":"uint256","name":"_id1","internalType":"uint256"},{"type":"uint256","name":"_id2","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"getOpenOrders","inputs":[{"type":"address","name":"_token1","internalType":"address"},{"type":"address","name":"_token2","internalType":"address"},{"type":"address","name":"_owner","internalType":"address"},{"type":"uint256","name":"_id","internalType":"uint256"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"getOrderBook","inputs":[{"type":"address","name":"_token_in","internalType":"address"},{"type":"address","name":"_token_out","internalType":"address"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"tuple","name":"","internalType":"struct TwoBearsOrders.Orders","components":[{"type":"uint256","name":"time","internalType":"uint256"},{"type":"uint256","name":"commission","internalType":"uint256"},{"type":"uint256","name":"value_in","internalType":"uint256"},{"type":"uint256","name":"price","internalType":"uint256"},{"type":"uint256","name":"value_out","internalType":"uint256"},{"type":"uint256","name":"exec_in","internalType":"uint256"},{"type":"uint256","name":"exec_out","internalType":"uint256"},{"type":"address","name":"token_in","internalType":"address"},{"type":"address","name":"token_out","internalType":"address"},{"type":"address","name":"owner","internalType":"address"},{"type":"uint8","name":"order_type","internalType":"uint8"},{"type":"uint8","name":"order_status","internalType":"uint8"}]}],"name":"getOrderByID","inputs":[{"type":"uint256","name":"_id","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"getOrderDataForOracle","inputs":[{"type":"uint256","name":"_id","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256[]","name":"","internalType":"uint256[]"}],"name":"get_ID_and_Prices_from_OrderBook","inputs":[{"type":"address","name":"_token_in","internalType":"address"},{"type":"address","name":"_token_out","internalType":"address"},{"type":"uint256","name":"_id_start","internalType":"uint256"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"id","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"owner","inputs":[]}];

                for (let i = 0; i < items.length; i++) {
                        try {
                                const operation = this.getNodeParameter('operation', i) as string;
                                const walletAddress = this.getNodeParameter('walletAddress', i) as string;
                                const rpcUrl = this.getNodeParameter('rpcUrl', i) as string;
                                const additionalOptions = this.getNodeParameter('additionalOptions', i) as any;

                                // Validate wallet address
                                if (!ethers.isAddress(walletAddress)) {
                                        throw new NodeOperationError(this.getNode(), `Invalid wallet address: ${walletAddress}`);
                                }

                                // Initialize provider
                                const provider = new ethers.JsonRpcProvider(rpcUrl);

                                let result: any = {};

                                switch (operation) {
                                        case 'getActiveProposalsDao':
                                                const proposalsContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                if (!ethers.isAddress(proposalsContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${proposalsContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.getActiveProposalsDao(provider, proposalsContractAddress, contractABI, walletAddress, additionalOptions);
                                                break;

                                        case 'getProposalDetails':
                                                const detailsContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                const detailsProposalId = this.getNodeParameter('proposalId', i) as string;
                                                if (!ethers.isAddress(detailsContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${detailsContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.getProposalDetails(provider, detailsContractAddress, contractABI, detailsProposalId, additionalOptions);
                                                break;

                                        case 'voteOnProposal':
                                                const voteContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                const daovoteCredentials = await this.getCredentials('callistoNetworkApi');
                                                const daovotePrivateKey = daovoteCredentials.privateKey as string;
                                                const proposalId = this.getNodeParameter('proposalId', i) as string;
                                                const voteChoice = this.getNodeParameter('voteChoice', i) as string;
                                                const voteGasLimit = this.getNodeParameter('gasLimit', i) as number;
                                                const voteGasPrice = this.getNodeParameter('gasPrice', i) as number;

                                                if (!ethers.isAddress(voteContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${voteContractAddress}`);
                                                }

                                                result = await CallistoNetwork.prototype.voteOnProposal(
                                                        provider,
                                                        walletAddress,
                                                        voteContractAddress,
                                                        contractABI,
                                                        daovotePrivateKey,
                                                        proposalId,
                                                        voteChoice === 'true',
                                                        voteGasLimit,
                                                        voteGasPrice,
                                                        additionalOptions
                                                );
                                                break;

                                        case 'checkDaoClaims':
                                                const claimsContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                if (!ethers.isAddress(claimsContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${claimsContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.checkDaoClaims(provider, walletAddress, claimsContractAddress, contractABI, additionalOptions);
                                                break;

                                        case 'executeAllDaoClaims':
                                                const claimContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                const claimDaoCredentials = await this.getCredentials('callistoNetworkApi');
                                                const claimDaoPrivateKey = claimDaoCredentials.privateKey as string;
                                                const gasLimit = this.getNodeParameter('gasLimit', i) as number;
                                                const gasPrice = this.getNodeParameter('gasPrice', i) as number;

                                                if (!ethers.isAddress(claimContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${claimContractAddress}`);
                                                }

                                                result = await CallistoNetwork.prototype.executeAllDaoClaims(
                                                        provider,
                                                        walletAddress,
                                                        claimContractAddress,
                                                        contractABI,
                                                        claimDaoPrivateKey,
                                                        gasLimit,
                                                        gasPrice,
                                                        additionalOptions
                                                );
                                                break;

                                        case 'getBalance':
                                                const onlyOnChange = this.getNodeParameter('onlyOnChange', i, true) as boolean;
                                                result = await CallistoNetwork.prototype.getBalance(this, provider, walletAddress, onlyOnChange);

                                                // If balance hasn't changed and onlyOnChange is true, skip this item
                                                if (result.balanceChanged === false && onlyOnChange) {
                                                        continue;
                                                }
                                                break;

                                        case 'listProposalIds':
                                                const listContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                if (!ethers.isAddress(listContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${listContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.listProposalIds(provider, listContractAddress, contractABI, additionalOptions);
                                                break;

                                        case 'getVotingPower':
                                                const powerContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                if (!ethers.isAddress(powerContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${powerContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.getVotingPower(provider, walletAddress, powerContractAddress, contractABI, additionalOptions);
                                                break;

                                        case 'sendCLO':
                                                const sendCredentials = await this.getCredentials('callistoNetworkApi');
                                                const sendPrivateKey = sendCredentials.privateKey as string;
                                                const recipientAddress = this.getNodeParameter('recipientAddress', i) as string;
                                                const amount = this.getNodeParameter('amount', i) as string;
                                                const sendGasLimit = this.getNodeParameter('gasLimit', i, 21000) as number;
                                                const sendGasPriceGwei = this.getNodeParameter('gasPrice', i, 1001) as number;

                                                if (!ethers.isAddress(recipientAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid recipient address: ${recipientAddress}`);
                                                }

                                                result = await CallistoNetwork.prototype.sendCLO(
                                                        provider,
                                                        walletAddress,
                                                        sendPrivateKey,
                                                        recipientAddress,
                                                        amount,
                                                        sendGasLimit,
                                                        sendGasPriceGwei,
                                                        additionalOptions
                                                );
                                                break;

                                        case 'getVoteHistory':
                                                const historyContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                if (!ethers.isAddress(historyContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${historyContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.getVoteHistory(provider, walletAddress, historyContractAddress, contractABI, additionalOptions);
                                                break;
                                        case 'checkColdStakingRewards':
                                                const coldStakingRewardsAddress = this.getNodeParameter('coldStakingContractAddress', i) as string;
                                                if (!ethers.isAddress(coldStakingRewardsAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid cold staking contract address: ${coldStakingRewardsAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.checkColdStakingRewards(provider, walletAddress, coldStakingRewardsAddress, coldStakingABI, additionalOptions);
                                                break;

                                        case 'withdrawColdStakingRewards':
                                                const withdrawColdStakingAddress = this.getNodeParameter('coldStakingContractAddress', i) as string;
                                                const withdrawCredentials = await this.getCredentials('callistoNetworkApi');
                                                const withdrawPrivateKey = withdrawCredentials.privateKey as string;
                                                const withdrawGasLimit = this.getNodeParameter('gasLimit', i) as number;
                                                const withdrawGasPrice = this.getNodeParameter('gasPrice', i) as number;

                                                if (!ethers.isAddress(withdrawColdStakingAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid cold staking contract address: ${withdrawColdStakingAddress}`);
                                                }

                                                result = await CallistoNetwork.prototype.withdrawColdStakingRewards(
                                                        provider,
                                                        walletAddress,
                                                        withdrawColdStakingAddress,
                                                        coldStakingABI,
                                                        withdrawPrivateKey,
                                                        withdrawGasLimit,
                                                        withdrawGasPrice,
                                                        additionalOptions
                                                );
                                                break;

                                        case 'claimColdStakingRewards':
                                                const claimColdStakingAddress = this.getNodeParameter('coldStakingContractAddress', i) as string;
                                                const claimCredentials = await this.getCredentials('callistoNetworkApi');
                                                const claimPrivateKey = claimCredentials.privateKey as string;
                                                const claimGasLimit = this.getNodeParameter('gasLimit', i) as number;
                                                const claimGasPrice = this.getNodeParameter('gasPrice', i) as number;

                                                if (!ethers.isAddress(claimColdStakingAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid cold staking contract address: ${claimColdStakingAddress}`);
                                                }

                                                result = await CallistoNetwork.prototype.claimColdStakingRewards(
                                                        provider,
                                                        walletAddress,
                                                        claimColdStakingAddress,
                                                        coldStakingABI,
                                                        claimPrivateKey,
                                                        claimGasLimit,
                                                        claimGasPrice,
                                                        additionalOptions
                                                );
                                                break;

                                        case 'startColdStaking':
                                                const startColdStakingAddress = this.getNodeParameter('coldStakingContractAddress', i) as string;
                                                const startColdStakingCredentials = await this.getCredentials('callistoNetworkApi');
                                                const startColdStakingPrivateKey = startColdStakingCredentials.privateKey as string;
                                                const startColdStakingGasLimit = this.getNodeParameter('gasLimit', i) as number;
                                                const startColdStakingGasPrice = this.getNodeParameter('gasPrice', i) as number;
                                                const startColdStakingAmount = this.getNodeParameter('amount', i) as string;

                                                if (!ethers.isAddress(startColdStakingAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid cold staking contract address: ${startColdStakingAddress}`);
                                                }

                                                result = await CallistoNetwork.prototype.startColdStaking(
                                                        provider,
                                                        walletAddress,
                                                        startColdStakingAddress,
                                                        coldStakingABI,
                                                        startColdStakingPrivateKey,
                                                        startColdStakingGasLimit,
                                                        startColdStakingGasPrice,
                                                        startColdStakingAmount,
                                                        additionalOptions
                                                );
                                                break;
					case 'createOrder':
						const createOrderContractAddress = this.getNodeParameter('twoBearsOrderContractAddress', i) as string;
                                                const createOrderCredentials = await this.getCredentials('callistoNetworkApi');
                                                const createOrderPrivateKey = createOrderCredentials.privateKey as string;
						const tokenIn = this.getNodeParameter('tokenIn', i) as string;
						const amountIn = this.getNodeParameter('amountIn', i) as number;
						const tokenOut = this.getNodeParameter('tokenOut', i) as string;
						const amountOut = this.getNodeParameter('amountOut', i) as number;
						const price = this.getNodeParameter('price', i) as number;
						const orderType = this.getNodeParameter('orderType', i) as number;
						const createOrderGasLimit = this.getNodeParameter('gasLimit', i) as number;
						const createOrderGasPrice = this.getNodeParameter('gasPrice', i) as number;

						if (!ethers.isAddress(createOrderContractAddress)) {
							throw new NodeOperationError(this.getNode(), `Invalid contract address: ${createOrderContractAddress}`);
						}

						result = await CallistoNetwork.prototype.createOrder(
							provider,
							walletAddress,
							createOrderContractAddress,
							twoBearsOrdersABI,
							createOrderPrivateKey,
							tokenIn,
							amountIn,
							tokenOut,
							amountOut,
							price,
							orderType,
							createOrderGasLimit,
							createOrderGasPrice,
							additionalOptions
						);
						break;

					case 'cancelOrder':
						const cancelOrderContractAddress = this.getNodeParameter('twoBearsOrderContractAddress', i) as string;
						const cancelOrderPrivateKey = this.getNodeParameter('privateKey', i) as string;
						const orderIds = this.getNodeParameter('orderIds', i) as string;
						const cancelOrderGasLimit = this.getNodeParameter('gasLimit', i) as number;
						const cancelOrderGasPrice = this.getNodeParameter('gasPrice', i) as number;

						if (!ethers.isAddress(cancelOrderContractAddress)) {
							throw new NodeOperationError(this.getNode(), `Invalid contract address: ${cancelOrderContractAddress}`);
						}

						result = await CallistoNetwork.prototype.cancelOrder(
							provider,
							walletAddress,
							cancelOrderContractAddress,
							twoBearsOrdersABI,
							cancelOrderPrivateKey,
							orderIds,
							cancelOrderGasLimit,
							cancelOrderGasPrice,
							additionalOptions
						);
						break;

					case 'getOpenOrders':
						const getOpenOrdersContractAddress = this.getNodeParameter('twoBearsOrderContractAddress', i) as string;
						const openOrdersTokenIn = this.getNodeParameter('tokenIn', i) as string;
						const openOrdersTokenOut = this.getNodeParameter('tokenOut', i) as string;
						const openOrdersAmount = this.getNodeParameter('amount', i) as number;

						if (!ethers.isAddress(getOpenOrdersContractAddress)) {
							throw new NodeOperationError(this.getNode(), `Invalid contract address: ${getOpenOrdersContractAddress}`);
						}

						result = await CallistoNetwork.prototype.getOpenOrders(
							provider,
							walletAddress,
							getOpenOrdersContractAddress,
							twoBearsOrdersABI,
							openOrdersTokenIn,
							openOrdersTokenOut,
							openOrdersAmount,
							additionalOptions
						);
						break;

					case 'getOrderBook':
						const getOrderBookContractAddress = this.getNodeParameter('twoBearsOrderContractAddress', i) as string;
						const orderBookTokenIn = this.getNodeParameter('tokenIn', i) as string;
						const orderBookTokenOut = this.getNodeParameter('tokenOut', i) as string;
						const orderBookAmount = this.getNodeParameter('amount', i) as number;

						if (!ethers.isAddress(getOrderBookContractAddress)) {
							throw new NodeOperationError(this.getNode(), `Invalid contract address: ${getOrderBookContractAddress}`);
						}

						result = await CallistoNetwork.prototype.getOrderBook(
							provider,
							getOrderBookContractAddress,
							twoBearsOrdersABI,
							orderBookTokenIn,
							orderBookTokenOut,
							orderBookAmount,
							additionalOptions
						);
						break;

					case 'getLatestBlockNumber':
                                                result = await CallistoNetwork.prototype.getLatestBlockNumber(
                                                    provider
                                                );
                                                break;
                    case 'scanBlocksForAddresses':
                        const startBlock = this.getNodeParameter('startBlock', i) as number;
                        const endBlock = this.getNodeParameter('endBlock', i) as number;
                        const rawWatchList = this.getNodeParameter('watchList', i) as string[];
                        const watchList = rawWatchList.map(addr => ({ address: addr }));
                        const autoFetchABI = this.getNodeParameter('autoFetchABI', i, true) as boolean;

                        result = await CallistoNetwork.prototype.scanBlocksForAddresses(
                            provider,
                            startBlock,
                            endBlock,
                            watchList,
                            autoFetchABI
                        );
                        break;


                                        default:
                                                throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
                                }

                                returnData.push({
                                        json: {
                                                operation,
                                                walletAddress,
                                                timestamp: new Date().toISOString(),
                                                success: true,
                                                ...result,
                                        },
                                });

                        } catch (error) {
                                if (this.continueOnFail()) {
                                        returnData.push({
                                                json: {
                                                        operation: this.getNodeParameter('operation', i),
                                                        walletAddress: this.getNodeParameter('walletAddress', i),
                                                        timestamp: new Date().toISOString(),
                                                        success: false,
                                                        error: (error as Error).message,
                                                },
                                        });
                                } else {
                                        throw new NodeOperationError(this.getNode(), (error as Error).message);
                                }
                        }
                }

                return [returnData];
        }

        // NEW: Check Cold Staking Rewards
        private async checkColdStakingRewards(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // Get current rewards
                        const reward = await contract.stake_reward(walletAddress);

                        // Get staker information
                        const stakerInfo = await contract.staker(walletAddress);
                        const [amount, time, multiplier, endTime] = stakerInfo;

                        // Get pool information
                        const [rewardPool, totalStaking] = await Promise.all([
                                contract.StakingRewardPool(),
                                contract.TotalStakingAmount()
                        ]);

                        const now = Math.floor(Date.now() / 1000);
                        const isActive = amount > BigInt(0);
                        const isMatured = Number(endTime) <= now && isActive;

                        return {
                                walletAddress,
                                contractAddress,
                                reward: ethers.formatEther(reward),
                                rewardWei: reward.toString(),
                                hasRewards: reward > BigInt(0),
                                stakingAmount: ethers.formatEther(amount),
                                stakingAmountWei: amount.toString(),
                                multiplier: Number(multiplier),
                                startTime: time > BigInt(0) ? new Date(Number(time) * 1000).toISOString() : null,
                                endTime: endTime > BigInt(0) ? new Date(Number(endTime) * 1000).toISOString() : null,
                                isActive,
                                isMatured,
                                canClaim: reward > BigInt(0),
                                poolInfo: {
                                        rewardPool: ethers.formatEther(rewardPool),
                                        totalStaking: ethers.formatEther(totalStaking),
                                },
                        };

                } catch (error) {
                        throw new Error(`Failed to check cold staking rewards: ${(error as Error).message}`);
                }
        }

        // NEW: Claim Cold Staking Rewards
        private async claimColdStakingRewards(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                privateKey: string,
                gasLimit: number,
                gasPrice: number,
                options: any
        ): Promise<any> {
                try {
                        const wallet = new ethers.Wallet(privateKey, provider);

                        if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
                                throw new Error('Private key does not match the provided wallet address');
                        }

                        const contract = new ethers.Contract(contractAddress, contractABI, wallet);

                        // Check current rewards before claiming
                        const rewardBefore = await contract.stake_reward(walletAddress);

                        if (rewardBefore === BigInt(0)) {
                                return {
                                        success: false,
                                        walletAddress,
                                        message: 'No rewards available to claim',
                                        rewardBefore: '0',
                                };
                        }

                        // Prepare transaction options
                        const txOptions = {
                                gasLimit: gasLimit,
                                gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
                        };

                        // Execute claim
                        const tx = await contract.claim(txOptions);
                        const receipt = await tx.wait();

                        // Check rewards after claiming
                        const rewardAfter = await contract.stake_reward(walletAddress);

                        return {
                                walletAddress,
                                success: true,
                                transactionHash: tx.hash,
                                blockNumber: receipt?.blockNumber,
                                gasUsed: receipt?.gasUsed?.toString(),
                                rewardBefore: ethers.formatEther(rewardBefore),
                                rewardAfter: ethers.formatEther(rewardAfter),
                                rewardClaimed: ethers.formatEther(rewardBefore - rewardAfter),
                                explorerUrl: `https://explorer.callistodao.org/tx/${tx.hash}`,
                                fee: receipt?.gasUsed && receipt?.gasPrice ?
                                        ethers.formatEther(receipt.gasUsed * receipt.gasPrice) : 'Unknown',
                        };

                } catch (error) {
                        throw new Error(`Failed to claim cold staking rewards: ${(error as Error).message}`);
                }
        }

        // NEW: Withdraw Cold Staking Rewards
        private async withdrawColdStakingRewards(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                privateKey: string,
                gasLimit: number,
                gasPrice: number,
                options: any
        ): Promise<any> {
                try {
                        const wallet = new ethers.Wallet(privateKey, provider);

                        if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
                                throw new Error('Private key does not match the provided wallet address');
                        }

                        const contract = new ethers.Contract(contractAddress, contractABI, wallet);

                        // Check current rewards before withdrawing
                        const rewardBefore = await contract.stake_reward(walletAddress);

                        if (rewardBefore === BigInt(0)) {
                                return {
                                        success: false,
                                        walletAddress,
                                        message: 'No rewards available to withdraw',
                                        rewardBefore: '0',
                                };
                        }

                        // Prepare transaction options
                        const txOptions = {
                                gasLimit: gasLimit,
                                gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
                        };

                        // Execute withdraw
                        const tx = await contract.withdraw_stake(walletAddress, txOptions);
                        const receipt = await tx.wait();

                        // Check rewards after withdrawing
                        const rewardAfter = await contract.stake_reward(walletAddress);

                        return {
                                walletAddress,
                                success: true,
                                transactionHash: tx.hash,
                                blockNumber: receipt?.blockNumber,
                                gasUsed: receipt?.gasUsed?.toString(),
                                rewardBefore: ethers.formatEther(rewardBefore),
                                rewardAfter: ethers.formatEther(rewardAfter),
                                rewardWithdrawed: ethers.formatEther(rewardBefore - rewardAfter),
                                explorerUrl: `https://explorer.callistodao.org/tx/${tx.hash}`,
                                fee: receipt?.gasUsed && receipt?.gasPrice ?
                                        ethers.formatEther(receipt.gasUsed * receipt.gasPrice) : 'Unknown',
                        };

                } catch (error) {
                        throw new Error(`Failed to withdraw cold staking rewards: ${(error as Error).message}`);
                }
        }

        // NEW: Start Cold Staking
        private async startColdStaking(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                privateKey: string,
                gasLimit: number,
                gasPrice: number,
                amount: string,
                options: any
        ): Promise<any> {
                try {
                        const wallet = new ethers.Wallet(privateKey, provider);

                        if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
                                throw new Error('Private key does not match the provided wallet address');
                        }

                        const contract = new ethers.Contract(contractAddress, contractABI, wallet);

                        // check balance
                        if (!wallet.provider) {
                                throw new Error('Provider not available');
                        }
                        const balance = await wallet.provider.getBalance(wallet.address);
                        const amountWei = ethers.parseEther(amount);

                        if (balance < amountWei) {
                                throw new Error('Insufficient balance');
                        }
                        // Prepare transaction options
                        const txOptions = {
                                gasLimit: gasLimit,
                                gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
                                value: amountWei
                        };

                        // Execute start - 1 round
                        const tx = await contract["start_staking(uint256)"](1, txOptions);
                        // Execute start
                        //const tx = await contract.start_staking(txOptions);
                        const receipt = await tx.wait();

                        return {
                                success: true,
                                transactionHash: tx.hash,
                                blockNumber: receipt?.blockNumber,
                                gasUsed: receipt?.gasUsed?.toString(),
                                amountStaked: amount,
                                explorerUrl: `https://explorer.callistodao.org/tx/${tx.hash}`,
                                fee: receipt?.gasUsed && receipt?.gasPrice ?
                                        ethers.formatEther(receipt.gasUsed * receipt.gasPrice) : 'Unknown',
                        };

                } catch (error) {
                        throw new Error(`Failed to start cold staking: ${(error as Error).message}`);
                }
        }

        private async getActiveProposalsDao(
                provider: ethers.JsonRpcProvider,
                contractAddress: string,
                contractABI: any[],
                walletAddress: string,
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        const totalVoting = Number(await contract.total_voting());
                        const activeProposals = [];
                        const allProposals = [];
                        const now = Math.floor(Date.now() / 1000);

                        const formatProposal = (proposal: any) => {
                                if (!proposal || !proposal.id) return null;
                                const statusNum = Number(proposal.status);
                                const isActive = statusNum === 1 && Number(proposal.deadLine) > now;

                                return {
                                        id: proposal.id.toString(),
                                        owner: proposal.owner,
                                        status: statusNum,
                                        statusName: statusNum === 1 ? 'Active' : statusNum === 3 ? 'Executed' : 'Rejected',
                                        comment: proposal.comment || '',
                                        reward: proposal.reward ? ethers.formatEther(proposal.reward) : '0',
                                        deadline: proposal.deadLine ? new Date(Number(proposal.deadLine) * 1000).toISOString() : null,
                                        vocesYes: proposal.vocesYes ? proposal.vocesYes.length : 0,
                                        vocesNo: proposal.vocesNo ? proposal.vocesNo.length : 0,
                                        totalVotes: (proposal.vocesYes?.length || 0) + (proposal.vocesNo?.length || 0),
                                        isActive,
                                        hasVoted: proposal.vocesYes?.includes(walletAddress) || proposal.vocesNo?.includes(walletAddress) || false
                                };
                        };

                        let proposals: any[] = [];
                        try {
                                proposals = await contract.getProposalsList(totalVoting, totalVoting);
                        } catch {
                                for (let i = 1; i <= totalVoting; i++) {
                                        try {
                                                const proposal = await contract.getProposal(i);
                                                proposals.push(proposal);
                                        } catch {
                                                continue;
                                        }
                                }
                        }

                        for (const proposal of proposals) {
                                const data = formatProposal(proposal);
                                if (!data) continue;
                                allProposals.push(data);
                                if (data.isActive && !data.hasVoted) activeProposals.push(data);
                        }

                        return {
                                totalProposals: totalVoting,
                                proposalsProcessed: allProposals.length,
                                activeProposalsCount: activeProposals.length,
                                activeProposals,
                                recentProposals: allProposals.slice(-10),
                        };

                } catch (error) {
                        throw new Error(`Failed to get active proposals: ${(error as Error).message}`);
                }
        }

        // List available proposal IDs - NEW
        private async listProposalIds(
                provider: ethers.JsonRpcProvider,
                contractAddress: string,
                contractABI: any[],
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        const totalVoting = await contract.total_voting();
                        const availableIds = [];
                        const invalidIds = [];

                        console.log(`Checking ${totalVoting} proposal IDs...`);

                        for (let i = 1; i <= Number(totalVoting); i++) {
                                try {
                                        const proposal = await contract.getProposal(i);
                                        if (proposal && proposal.id !== undefined) {
                                                availableIds.push({
                                                        id: i,
                                                        status: proposal.status,
                                                        statusName: Number(proposal.status) === 1 ? 'Active' : Number(proposal.status) === 3 ? 'Executed' : 'Rejected',
                                                        comment: proposal.comment ? proposal.comment.substring(0, 50) + '...' : 'No comment',
                                                        deadline: proposal.deadLine ? new Date(Number(proposal.deadLine) * 1000).toISOString() : null,
                                                });
                                        }
                                } catch (err) {
                                        invalidIds.push(i);
                                }
                        }

                        return {
                                totalExpected: Number(totalVoting),
                                validProposals: availableIds.length,
                                invalidProposals: invalidIds.length,
                                availableIds: availableIds,
                                invalidIds: invalidIds.length > 0 ? invalidIds.slice(0, 10) : [], // Show first 10 invalid IDs
                                suggestion: availableIds.length > 0 ?
                                        `Use proposal IDs: ${availableIds.slice(0, 5).map(p => p.id).join(', ')}${availableIds.length > 5 ? '...' : ''}` :
                                        'No valid proposals found',
                        };

                } catch (error) {
                        throw new Error(`Failed to list proposal IDs: ${(error as Error).message}`);
                }
        }

        // Get proposal details - FIXED with validation
        private async getProposalDetails(
                provider: ethers.JsonRpcProvider,
                contractAddress: string,
                contractABI: any[],
                proposalId: string,
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // First check if the proposal exists by checking the total
                        const totalVoting = await contract.total_voting();
                        const proposalIdNum = parseInt(proposalId);

                        if (proposalIdNum > Number(totalVoting) || proposalIdNum < 1) {
                                throw new Error(`Proposal ID ${proposalId} does not exist. Total proposals: ${totalVoting}`);
                        }

                        // Try to get the proposal with detailed error handling
                        let proposal;
                        try {
                                proposal = await contract.getProposal(proposalId);
                        } catch (contractError: any) {
                                // If the call fails, try with an alternative method
                                throw new Error(`Proposal ${proposalId} not found or invalid. Contract returned: ${contractError.message || 'Unknown error'}`);
                        }

                        // Check that the returned proposal is valid
                        if (!proposal || proposal.id === undefined) {
                                throw new Error(`Proposal ${proposalId} exists but returned empty data`);
                        }

                        const now = Math.floor(Date.now() / 1000);
                        const isActive = Number(proposal.status) === 1 && Number(proposal.deadLine) > now;

                        // Safe handling of arrays that might be undefined
                        const vocesYes = proposal.vocesYes || [];
                        const vocesNo = proposal.vocesNo || [];

                        return {
                                id: proposal.id.toString(),
                                owner: proposal.owner || '0x0000000000000000000000000000000000000000',
                                status: proposal.status,
                                statusName: Number(proposal.status) === 1 ? 'Active' : Number(proposal.status) === 3 ? 'Executed' : 'Rejected',
                                comment: proposal.comment || '',
                                reward: proposal.reward ? ethers.formatEther(proposal.reward) : '0',
                                rewardWei: proposal.reward ? proposal.reward.toString() : '0',
                                time: proposal.time ? new Date(Number(proposal.time) * 1000).toISOString() : null,
                                deadline: proposal.deadLine ? new Date(Number(proposal.deadLine) * 1000).toISOString() : null,
                                to: proposal.to || '0x0000000000000000000000000000000000000000',
                                data: proposal.data || '0x',
                                vocesYes: vocesYes,
                                vocesNo: vocesNo,
                                totalVotesYes: vocesYes.length,
                                totalVotesNo: vocesNo.length,
                                totalVotes: vocesYes.length + vocesNo.length,
                                isActive,
                                canVote: isActive,
                                exists: true,
                        };

                } catch (error) {
                        // Return detailed error information
                        return {
                                id: proposalId,
                                exists: false,
                                error: (error as Error).message,
                                suggestion: 'Try checking available proposal IDs with getActiveProposalsDao first',
                        };
                }
        }

        // Vote on proposal - FIXED
        private async voteOnProposal(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                privateKey: string,
                proposalId: string,
                voteChoice: boolean, // true = yes, false = no
                gasLimit: number,
                gasPrice: number,
                options: any
        ): Promise<any> {
                try {
                        const wallet = new ethers.Wallet(privateKey, provider);

                        if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
                                throw new Error('Private key does not match the provided wallet address');
                        }

                        const contract = new ethers.Contract(contractAddress, contractABI, wallet);

                        // Check if the proposal exists and is active
                        const proposal = await contract.getProposal(proposalId);
                        const now = Math.floor(Date.now() / 1000);

                        if (Number(proposal.status) !== 1) {
                                throw new Error(`Proposal is not active. Current status: ${proposal.status}`);
                        }

                        if (Number(proposal.deadLine) <= now) {
                                throw new Error('Proposal deadline has passed');
                        }

                        // Check if user has already voted
                        const hasVoted = proposal.vocesYes.includes(walletAddress) || proposal.vocesNo.includes(walletAddress);
                        if (hasVoted) {
                                throw new Error('You have already voted on this proposal');
                        }

                        // Prepare transaction options
                        const txOptions = {
                                gasLimit: gasLimit,
                                gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
                        };

                        // Vote
                        const tx = await contract.vote(proposalId, voteChoice, txOptions);
                        const receipt = await tx.wait();

                        // Get updated proposal information
                        const updatedProposal = await contract.getProposal(proposalId);

                        return {
                                success: true,
                                transactionHash: tx.hash,
                                blockNumber: receipt?.blockNumber,
                                gasUsed: receipt?.gasUsed.toString(),
                                proposalId,
                                voteChoice: voteChoice ? 'Yes' : 'No',
                                updatedVotes: {
                                        yes: updatedProposal.vocesYes.length,
                                        no: updatedProposal.vocesNo.length,
                                        total: updatedProposal.vocesYes.length + updatedProposal.vocesNo.length,
                                },
                                explorerUrl: `https://explorer.callistodao.org/tx/${tx.hash}`,
                        };

                } catch (error) {
                        throw new Error(`Failed to vote on proposal: ${(error as Error).message}`);
                }
        }

        // Check claims - FIXED
        private async checkDaoClaims(
            provider: ethers.JsonRpcProvider,
            walletAddress: string,
            contractAddress: string,
            contractABI: any[],
            options: any
        ): Promise<any> {
            const contract = new ethers.Contract(contractAddress, contractABI, provider);

            try {
                // Récupérer le dernier ID connu
                const totalVoting: bigint = await contract.total_voting();
                const maxId = Number(totalVoting); // dernier ID de proposition

                const batchSize = 100;
                let allClaimIds: bigint[] = [];
                let allClaimStatuses: boolean[] = [];

                // ---- Boucle par batchs jusqu’au dernier ID ----
                for (let startId = 1; startId <= maxId; startId += batchSize) {
                    const claimsList = await contract.getClaimList(walletAddress, startId, batchSize);

                    const claimIds: bigint[] = claimsList[0];
                    const claimStatuses: boolean[] = claimsList[1];

                    if (claimIds.length > 0) {
                        allClaimIds = allClaimIds.concat(claimIds);
                        allClaimStatuses = allClaimStatuses.concat(claimStatuses);
                    }
                }

                // ---- Analyse des claims ----
                const availableClaims = [];
                let totalClaimable = BigInt(0);

                for (let i = 0; i < allClaimIds.length; i++) {
                    if (allClaimStatuses[i]) { // claimable
                        try {
                            const proposal = await contract.getProposal(allClaimIds[i]);
                            availableClaims.push({
                                proposalId: allClaimIds[i].toString(),
                                reward: ethers.formatEther(proposal.reward),
                                rewardWei: proposal.reward.toString(),
                                comment: proposal.comment,
                            });
                            totalClaimable += proposal.reward;
                        } catch (err) {
                            console.warn(`Erreur sur proposal ${allClaimIds[i]}:`, err);
                            continue;
                        }
                    }
                }

                return {
                    totalClaimable: ethers.formatEther(totalClaimable),
                    totalClaimableWei: totalClaimable.toString(),
                    availableClaimsCount: availableClaims.length,
                    availableClaims,
                    canClaim: availableClaims.length > 0,
                };

            } catch (error) {
                throw new Error(`Failed to check claims: ${(error as Error).message}`);
            }
        }

        private async executeAllDaoClaims(
            provider: ethers.JsonRpcProvider,
            walletAddress: string,
            contractAddress: string,
            contractABI: any[],
            privateKey: string,
            gasLimit: number,
            gasPrice: number,
            options: any = {}
        ): Promise<any> {

            const wallet = new ethers.Wallet(privateKey, provider);
            if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error('Private key does not match the provided wallet address');
            }

            const contract = new ethers.Contract(contractAddress, contractABI, wallet);

            // ---- 1. Récupérer tous les claims jusqu'à total_voting ----
            const totalVoting: bigint = await contract.total_voting();
            const maxId = Number(totalVoting);

            const batchSize = options.batchSize || 100;
            let allClaimIds: bigint[] = [];
            let allClaimStatuses: boolean[] = [];

            for (let startId = 1; startId <= maxId; startId += batchSize) {
                const claimsList = await contract.getClaimList(walletAddress, startId, batchSize);
                allClaimIds = allClaimIds.concat(claimsList[0]);
                allClaimStatuses = allClaimStatuses.concat(claimsList[1]);
            }

            const claimsDetailed: any[] = [];
            for (let i = 0; i < allClaimIds.length; i++) {
                const proposalId = allClaimIds[i];
                let status: "alreadyClaimed" | "claimable" | "notClaimable" = "notClaimable";

                if (allClaimStatuses[i]) {
                    const canClaim: boolean = await contract.checkClaim(proposalId, walletAddress);
                    status = canClaim ? "claimable" : "alreadyClaimed";
                }

                let reward = BigInt(0);
                let comment = "";
                try {
                    const proposal = await contract.getProposal(proposalId);
                    reward = proposal.reward;
                    comment = proposal.comment;
                } catch {}

                claimsDetailed.push({
                    proposalId: proposalId.toString(),
                    reward: ethers.formatEther(reward),
                    rewardWei: reward.toString(),
                    comment,
                    status
                });
            }

            const claimableProposals = claimsDetailed.filter(c => c.status === "claimable");
            const executedClaims: any[] = [];
            let totalRewardClaimed = BigInt(0);

            if (claimableProposals.length > 0) {
                const txOptions: any = {
                    gasLimit,
                    gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei')
                };
                if (options.maxFeePerGas) txOptions.maxFeePerGas = ethers.parseUnits(options.maxFeePerGas.toString(), 'gwei');
                if (options.maxPriorityFeePerGas) txOptions.maxPriorityFeePerGas = ethers.parseUnits(options.maxPriorityFeePerGas.toString(), 'gwei');

                for (const c of claimableProposals) {
                    try {
                        const tx = await contract.claim(BigInt(c.proposalId), txOptions);
                        const receipt = await tx.wait();
                        if (!receipt || receipt.status === 0) throw new Error('Transaction failed');

                        totalRewardClaimed += BigInt(c.rewardWei);

                        executedClaims.push({
                            ...c,
                            success: true,
                            transactionHash: tx.hash,
                            blockNumber: receipt.blockNumber,
                            gasUsed: receipt.gasUsed?.toString() || '0'
                        });

                        if (options.delayBetweenClaims) {
                            await new Promise(resolve => setTimeout(resolve, options.delayBetweenClaims));
                        }
                    } catch (err) {
                        executedClaims.push({
                            ...c,
                            success: false,
                            message: (err as Error).message
                        });
                    }
                }
            }

            return {
                totalRewardClaimed: ethers.formatEther(totalRewardClaimed),
                claimableCount: claimableProposals.length,
                executedClaims
            };
        }

        // Get voting power - FIXED
        private async getVotingPower(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // Get user information
                        const user = await contract.getUser(walletAddress);

                        return {
                                userIndex: user.index.toString(),
                                votes: user.votes.toString(),
                                votingPower: user.votes.toString(),
                                name: user.name,
                                entered: new Date(Number(user.entered) * 1000).toISOString(),
                                isDAOMember: user.index > 0,
                        };

                } catch (error) {
                        throw new Error(`Failed to get voting power: ${(error as Error).message}`);
                }
        }

        // Get vote history - FIXED
        private async getVoteHistory(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // Get all proposals and check which ones the user voted on
                        const totalVoting = await contract.total_voting();
                        const maxProposals = Math.min(Number(totalVoting), 50);

                        const voteHistory = [];
                        let totalVotes = 0;

                        for (let i = 1; i <= maxProposals; i++) {
                                try {
                                        const proposal = await contract.getProposal(i);

                                        let userVote = null;
                                        if (proposal.vocesYes.includes(walletAddress)) {
                                                userVote = 'Yes';
                                                totalVotes++;
                                        } else if (proposal.vocesNo.includes(walletAddress)) {
                                                userVote = 'No';
                                                totalVotes++;
                                        }

                                        if (userVote) {
                                                voteHistory.push({
                                                        proposalId: i.toString(),
                                                        vote: userVote,
                                                        comment: proposal.comment,
                                                        reward: ethers.formatEther(proposal.reward),
                                                        deadline: new Date(Number(proposal.deadLine) * 1000).toISOString(),
                                                        status: proposal.status,
                                                        statusName: proposal.status === 0 ? 'Active' : proposal.status === 1 ? 'Executed' : 'Rejected',
                                                });
                                        }
                                } catch (err) {
                                        continue;
                                }
                        }

                        // Sort by proposal ID (most recent first)
                        voteHistory.sort((a, b) => parseInt(b.proposalId) - parseInt(a.proposalId));

                        return {
                                totalVotes,
                                voteHistory: voteHistory.slice(0, 20), // Return the 20 most recent
                        };

                } catch (error) {
                        throw new Error(`Failed to get vote history: ${(error as Error).message}`);
                }
        }
        private async sendCLO(
                provider: ethers.JsonRpcProvider,
                senderAddress: string,
                privateKey: string,
                recipientAddress: string,
                amount: string,
                gasLimit: number,
                gasPrice: number,
                options: any
        ): Promise<any> {
                try {
                        const wallet = new ethers.Wallet(privateKey, provider);

                        if (wallet.address.toLowerCase() !== senderAddress.toLowerCase()) {
                                throw new Error('Private key does not match the provided wallet address');
                        }

                        // Validate amount
                        let amountWei: bigint;
                        try {
                                amountWei = ethers.parseEther(amount);
                        } catch (error) {
                                throw new Error(`Invalid amount format: ${amount}`);
                        }

                        if (amountWei <= BigInt(0)) {
                                throw new Error('Amount must be greater than 0');
                        }

                        // Get balance
                        const senderBalance = await provider.getBalance(senderAddress);
                        const gasCost = BigInt(gasLimit) * ethers.parseUnits(gasPrice.toString(), 'gwei');
                        const totalCost = amountWei + gasCost;

                        if (senderBalance < totalCost) {
                                throw new Error(
                                        `Insufficient balance. Required: ${ethers.formatEther(totalCost)} CLO, ` +
                                        `Available: ${ethers.formatEther(senderBalance)} CLO`
                                );
                        }

                        // Send transaction
                        const transaction = await wallet.sendTransaction({
                                to: recipientAddress,
                                value: amountWei,
                                gasLimit: gasLimit,
                                gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
                        });

                        // Wait for confirmation
                        const receipt = await transaction.wait();

                        return {
                                success: true,
                                transactionHash: transaction.hash,
                                blockNumber: receipt?.blockNumber,
                                gasUsed: receipt?.gasUsed?.toString(),
                                from: senderAddress,
                                to: recipientAddress,
                                amount: amount,
                                amountWei: amountWei.toString(),
                                explorerUrl: `https://explorer.callistodao.org/tx/${transaction.hash}`,
                                fee: receipt?.gasUsed && receipt?.gasPrice ?
                                        ethers.formatEther(receipt.gasUsed * receipt.gasPrice) : 'Unknown',
                        };

                } catch (error) {
                        console.error('SendCLO Error:', error);
                        throw new Error(`Failed to send CLO: ${(error as Error).message}`);
                }
        }

        // Get wallet balance with change detection
        private async getBalance(
                executeFunctions: IExecuteFunctions,
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                onlyOnChange: boolean = true
        ): Promise<any> {
                try {
                        // Get current balance from blockchain
                        const balance = await provider.getBalance(walletAddress);
                        const blockNumber = await provider.getBlockNumber();
                        const currentBalance = ethers.formatEther(balance);
                        const currentBalanceWei = balance.toString();

                        // Get workflow static data to store/retrieve previous balance
                        const workflowStaticData = executeFunctions.getWorkflowStaticData('node');
                        const balanceKey = `balance_${walletAddress}`;
                        const balanceWeiKey = `balance_wei_${walletAddress}`;
                        const lastCheckKey = `last_check_${walletAddress}`;

                        // Get previous balance (default to "0" if first time)
                        const previousBalance = workflowStaticData[balanceKey] as string || "0";
                        const previousBalanceWei = workflowStaticData[balanceWeiKey] as string || "0";
                        const lastCheck = workflowStaticData[lastCheckKey] as string || null;

                        // Check if balance has changed (compare Wei values for precision)
                        const balanceChanged = currentBalanceWei !== previousBalanceWei;

                        // Calculate balance change
                        const balanceChangeBigInt = balance - BigInt(previousBalanceWei);
                        const balanceChange = ethers.formatEther(balanceChangeBigInt);

                        // Update stored values
                        workflowStaticData[balanceKey] = currentBalance;
                        workflowStaticData[balanceWeiKey] = currentBalanceWei;
                        workflowStaticData[lastCheckKey] = new Date().toISOString();

                        return {
                                balance: currentBalance,
                                balanceWei: currentBalanceWei,
                                previousBalance: previousBalance,
                                previousBalanceWei: previousBalanceWei,
                                balanceChange: balanceChange,
                                balanceChangeWei: balanceChangeBigInt.toString(),
                                balanceChanged: balanceChanged,
                                blockNumber,
                                currency: 'CLO',
                                lastCheck: lastCheck,
                                currentCheck: new Date().toISOString(),
                                // Additional useful information
                                isFirstCheck: lastCheck === null,
                                balanceIncreased: balanceChangeBigInt > 0,
                                balanceDecreased: balanceChangeBigInt < 0,
                        };

                } catch (error) {
                        throw new Error(`Failed to get balance: ${(error as Error).message}`);
                }
        }

	private async createOrder(
		provider: ethers.JsonRpcProvider,
		walletAddress: string,
		contractAddress: string,
		contractABI: any[],
		privateKey: string,
		tokenIn: string,
		amountIn: number,
		tokenOut: string,
		amountOut: number,
		price: number,
		orderType: number,
		gasLimit: number,
		gasPrice: number,
		options: any
	): Promise<any> {
		try {
			const wallet = new ethers.Wallet(privateKey, provider);

			if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
				throw new Error('Private key does not match the provided wallet address');
			}

			const contract = new ethers.Contract(contractAddress, contractABI, wallet);

			const txOptions = {
				gasLimit: gasLimit,
				gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
			};

			const tx = await contract.createOrder(
				walletAddress,
				tokenIn,
				ethers.parseEther(amountIn.toString()),
				tokenOut,
				ethers.parseEther(amountOut.toString()),
				orderType,
				ethers.parseEther(price.toString()),
				0, // _order_position
				1, // _dex_fee
				100, // _dex_num_exec_ord
				txOptions
			);

			const receipt = await tx.wait();

			return {
				success: true,
				transactionHash: tx.hash,
				blockNumber: receipt?.blockNumber,
				gasUsed: receipt?.gasUsed.toString(),
				explorerUrl: `https://explorer.callistodao.org/tx/${tx.hash}`,
			};

		} catch (error) {
			throw new Error(`Failed to create order: ${(error as Error).message}`);
		}
	}

	private async cancelOrder(
		provider: ethers.JsonRpcProvider,
		walletAddress: string,
		contractAddress: string,
		contractABI: any[],
		privateKey: string,
		orderIds: string,
		gasLimit: number,
		gasPrice: number,
		options: any
	): Promise<any> {
		try {
			const wallet = new ethers.Wallet(privateKey, provider);

			if (wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
				throw new Error('Private key does not match the provided wallet address');
			}

			const contract = new ethers.Contract(contractAddress, contractABI, wallet);

			const txOptions = {
				gasLimit: gasLimit,
				gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
			};

			const ids = orderIds.split(',').map(id => BigInt(id.trim()));

			const tx = await contract.cancelOrders(ids, txOptions);

			const receipt = await tx.wait();

			return {
				success: true,
				transactionHash: tx.hash,
				blockNumber: receipt?.blockNumber,
				gasUsed: receipt?.gasUsed.toString(),
				explorerUrl: `https://explorer.callistodao.org/tx/${tx.hash}`,
			};

		} catch (error) {
			throw new Error(`Failed to cancel order: ${(error as Error).message}`);
		}
	}

	private async getOpenOrders(
		provider: ethers.JsonRpcProvider,
		walletAddress: string,
		contractAddress: string,
		contractABI: any[],
		tokenIn: string,
		tokenOut: string,
		amount: number,
		options: any
	): Promise<any> {
		const contract = new ethers.Contract(contractAddress, contractABI, provider);

		try {
			const openOrders = await contract.getOpenOrders(tokenIn, tokenOut, walletAddress, 0, amount);
			return {
				openOrders,
			};
		} catch (error) {
			throw new Error(`Failed to get open orders: ${(error as Error).message}`);
		}
	}

	private async getOrderBook(
		provider: ethers.JsonRpcProvider,
		contractAddress: string,
		contractABI: any[],
		tokenIn: string,
		tokenOut: string,
		amount: number,
		options: any
	): Promise<any> {
		const contract = new ethers.Contract(contractAddress, contractABI, provider);

		try {
			const orderBook = await contract.getOrderBook(tokenIn, tokenOut, amount);
			return {
				orderBook,
			};
		} catch (error) {
			throw new Error(`Failed to get order book: ${(error as Error).message}`);
		}
	}

    private async getLatestBlockNumber(provider: ethers.JsonRpcProvider): Promise<any> {
        try {
            const blockNumber = await provider.getBlockNumber();
            return {
                success: true,
                blockNumber
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to fetch latest block number: ${(error as Error).message}`
            };
        }
    }


    private async fetchABI(address: string): Promise<any[] | null> {
        try {
            const url = `https://explorer.callistodao.org/api?module=contract&action=getabi&address=${address}`;
            const res = await fetch(url, { headers: { accept: 'application/json' } });
            const data: any = await res.json();
            if (data.status === "1" && data.result) {
                return JSON.parse(data.result);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    private async scanBlocksForAddresses(
        provider: ethers.JsonRpcProvider,
        startBlock: number,
        endBlock: number,
        watchList: { address: string, label?: string }[],
        autoFetchABI: boolean = true
    ): Promise<any> {
        try {
            const normalizedWatchList = watchList.map(w => ({
                address: w.address.toLowerCase(),
                label: w.label || w.address
            }));
            const events: any[] = [];

            for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
                const block = await provider.getBlock(blockNumber);
                if (!block || !block.transactions) continue;

                for (const txHash of block.transactions) {
                    const tx = await provider.getTransaction(txHash);
                    if (!tx) continue;

                    const from = tx.from?.toLowerCase();
                    const to = tx.to?.toLowerCase();

                    const watchFrom = normalizedWatchList.find(w => w.address === from);
                    const watchTo = normalizedWatchList.find(w => w.address === to);

                    if (!watchFrom && !watchTo) continue;

                    const receipt = await provider.getTransactionReceipt(tx.hash);
                    const status = receipt?.status === 1 ? "Success" : "Failed";

                    let functionName = "Unknown";
                    if (autoFetchABI && tx.to) {
                        const fetchedABI = await this.fetchABI(tx.to);
                        if (fetchedABI) {
                            try {
                                const iface = new ethers.Interface(fetchedABI);
                                const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
                                functionName = decoded?.name || "Unknown";
                            } catch {}
                        }
                    }

                    let txFee = "0";
                    if (receipt) {
                        const gasPrice = tx.gasPrice ?? 0;
                        txFee = ethers.formatEther(receipt.gasUsed * gasPrice);
                    }

                    events.push({
                        blockNumber: block.number,
                        txHash: tx.hash,
                        type: "Contract Call",
                        status,
                        functionName,
                        from: tx.from,
                        to: watchTo ? `${watchTo.label} (${tx.to})` : tx.to,
                        value: ethers.formatEther(tx.value),
                        txFee,
                        timestamp: block.timestamp
                    });
                }
            }

            return {
                success: true,
                scannedBlocks: endBlock - startBlock + 1,
                totalEvents: events.length,
                events
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to scan blocks: ${(error as Error).message}`
            };
        }
    }

}
