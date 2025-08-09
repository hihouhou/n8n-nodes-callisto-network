import {
        IExecuteFunctions,
        INodeExecutionData,
        INodeType,
        INodeTypeDescription,
        NodeOperationError,
        NodeConnectionType,
} from 'n8n-workflow';

import { ethers } from 'ethers';

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
                                                name: 'Check Claims',
                                                value: 'checkClaims',
                                                description: 'Check available claims for a wallet',
                                                action: 'Check claims for a wallet',
                                        },
                                        {
                                                name: 'Execute Claim',
                                                value: 'executeClaim',
                                                description: 'Execute a claim transaction',
                                                action: 'Execute a claim transaction',
                                        },
                                        {
                                                name: 'Vote on Proposal',
                                                value: 'voteOnProposal',
                                                description: 'Vote on a DAO proposal',
                                                action: 'Vote on a DAO proposal',
                                        },
                                        {
                                                name: 'Get Active Proposals',
                                                value: 'getActiveProposals',
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
                                                name: 'List Available Proposal IDs',
                                                value: 'listProposalIds',
                                                description: 'Get list of all available proposal IDs',
                                                action: 'Get available proposal IDs',
                                        },
                                ],
                                default: 'getActiveProposals',
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
                                displayName: 'Private Key',
                                name: 'privateKey',
                                type: 'string',
                                typeOptions: {
                                        password: true,
                                },
                                displayOptions: {
                                        show: {
                                                operation: ['executeClaim', 'voteOnProposal'],
                                        },
                                },
                                default: '',
                                description: 'Private key for signing transactions (keep secure)',
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
                                                operation: ['checkClaims', 'executeClaim', 'getVoteHistory', 'voteOnProposal', 'getActiveProposals', 'getProposalDetails', 'getVotingPower', 'listProposalIds'],
                                        },
                                },
                                default: '0x810059e1406dEDAFd1BdCa4E0137CbA306c0Ce36',
                                placeholder: '0x810059e1406dEDAFd1BdCa4E0137CbA306c0Ce36',
                                description: 'The address of the DAO contract',
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
                                                operation: ['executeClaim', 'voteOnProposal'],
                                        },
                                },
                                default: 150000,
                                description: 'Gas limit for the transaction',
                        },
                        {
                                displayName: 'Gas Price (Gwei)',
                                name: 'gasPrice',
                                type: 'number',
                                displayOptions: {
                                        show: {
                                                operation: ['executeClaim', 'voteOnProposal'],
                                        },
                                },
                                default: 20,
                                description: 'Gas price in Gwei',
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

                // ABI du contrat DAO Callisto Network basé sur votre fichier
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
                                        case 'getActiveProposals':
                                                const proposalsContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                if (!ethers.isAddress(proposalsContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${proposalsContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.getActiveProposals(provider, proposalsContractAddress, contractABI, additionalOptions);
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
                                                const votePrivateKey = this.getNodeParameter('privateKey', i) as string;
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
                                                        votePrivateKey,
                                                        proposalId,
                                                        voteChoice === 'true',
                                                        voteGasLimit,
                                                        voteGasPrice,
                                                        additionalOptions
                                                );
                                                break;

                                        case 'checkClaims':
                                                const claimsContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                if (!ethers.isAddress(claimsContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${claimsContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.checkClaims(provider, walletAddress, claimsContractAddress, contractABI, additionalOptions);
                                                break;

                                        case 'executeClaim':
                                                const claimContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                const privateKey = this.getNodeParameter('privateKey', i) as string;
                                                const gasLimit = this.getNodeParameter('gasLimit', i) as number;
                                                const gasPrice = this.getNodeParameter('gasPrice', i) as number;

                                                if (!ethers.isAddress(claimContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${claimContractAddress}`);
                                                }

                                                result = await CallistoNetwork.prototype.executeClaim(
                                                        provider,
                                                        walletAddress,
                                                        claimContractAddress,
                                                        contractABI,
                                                        privateKey,
                                                        gasLimit,
                                                        gasPrice,
                                                        additionalOptions
                                                );
                                                break;

                                        case 'getBalance':
                                                result = await CallistoNetwork.prototype.getBalance(provider, walletAddress);
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

                                        case 'getVoteHistory':
                                                const historyContractAddress = this.getNodeParameter('contractAddress', i) as string;
                                                if (!ethers.isAddress(historyContractAddress)) {
                                                        throw new NodeOperationError(this.getNode(), `Invalid contract address: ${historyContractAddress}`);
                                                }
                                                result = await CallistoNetwork.prototype.getVoteHistory(provider, walletAddress, historyContractAddress, contractABI, additionalOptions);
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

        // Get active proposals - CORRIGÉ pour utiliser la bonne ABI
        private async getActiveProposals(
                provider: ethers.JsonRpcProvider,
                contractAddress: string,
                contractABI: any[],
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // Récupérer le nombre total de votes/propositions
                        const totalVoting = await contract.total_voting();
                        const maxProposals = Math.min(Number(totalVoting), options.maxProposals || 20);

                        const activeProposals = [];
                        const allProposals = [];

                        // Récupérer les propositions en utilisant getProposalsList
                        try {
                                const proposals = await contract.getProposalsList(1, maxProposals);

                                for (const proposal of proposals) {
                                        const now = Math.floor(Date.now() / 1000);
                                        const isActive = proposal.status === 0 && Number(proposal.deadLine) > now;

                                        const proposalData = {
                                                id: proposal.id.toString(),
                                                owner: proposal.owner,
                                                status: proposal.status,
                                                statusName: proposal.status === 0 ? 'Active' : proposal.status === 1 ? 'Executed' : 'Rejected',
                                                comment: proposal.comment,
                                                reward: ethers.formatEther(proposal.reward),
                                                deadline: new Date(Number(proposal.deadLine) * 1000).toISOString(),
                                                vocesYes: proposal.vocesYes.length,
                                                vocesNo: proposal.vocesNo.length,
                                                totalVotes: proposal.vocesYes.length + proposal.vocesNo.length,
                                                isActive,
                                        };

                                        allProposals.push(proposalData);

                                        if (isActive) {
                                                activeProposals.push(proposalData);
                                        }
                                }
                        } catch (error) {
                                // Si getProposalsList échoue, essayer de récupérer individuellement
                                for (let i = 1; i <= maxProposals; i++) {
                                        try {
                                                const proposal = await contract.getProposal(i);
                                                const now = Math.floor(Date.now() / 1000);
                                                const isActive = proposal.status === 0 && Number(proposal.deadLine) > now;

                                                const proposalData = {
                                                        id: proposal.id.toString(),
                                                        owner: proposal.owner,
                                                        status: proposal.status,
                                                        statusName: proposal.status === 0 ? 'Active' : proposal.status === 1 ? 'Executed' : 'Rejected',
                                                        comment: proposal.comment,
                                                        reward: ethers.formatEther(proposal.reward),
                                                        deadline: new Date(Number(proposal.deadLine) * 1000).toISOString(),
                                                        vocesYes: proposal.vocesYes.length,
                                                        vocesNo: proposal.vocesNo.length,
                                                        totalVotes: proposal.vocesYes.length + proposal.vocesNo.length,
                                                        isActive,
                                                };

                                                allProposals.push(proposalData);

                                                if (isActive) {
                                                        activeProposals.push(proposalData);
                                                }
                                        } catch (err) {
                                                // Ignorer les erreurs pour des IDs inexistants
                                                continue;
                                        }
                                }
                        }

                        return {
                                totalProposals: Number(totalVoting),
                                proposalsProcessed: allProposals.length,
                                activeProposalsCount: activeProposals.length,
                                activeProposals,
                                recentProposals: allProposals.slice(0, 10),
                        };

                } catch (error) {
                        throw new Error(`Failed to get active proposals: ${(error as Error).message}`);
                }
        }

        // List available proposal IDs - NOUVEAU
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
                                                        statusName: proposal.status === 0 ? 'Active' : proposal.status === 1 ? 'Executed' : 'Rejected',
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
                                invalidIds: invalidIds.length > 0 ? invalidIds.slice(0, 10) : [], // Montrer les 10 premiers IDs invalides
                                suggestion: availableIds.length > 0 ?
                                        `Use proposal IDs: ${availableIds.slice(0, 5).map(p => p.id).join(', ')}${availableIds.length > 5 ? '...' : ''}` :
                                        'No valid proposals found',
                        };

                } catch (error) {
                        throw new Error(`Failed to list proposal IDs: ${(error as Error).message}`);
                }
        }

        // Get proposal details - CORRIGÉ avec validation
        private async getProposalDetails(
                provider: ethers.JsonRpcProvider,
                contractAddress: string,
                contractABI: any[],
                proposalId: string,
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // Vérifier d'abord si la proposition existe en vérifiant le total
                        const totalVoting = await contract.total_voting();
                        const proposalIdNum = parseInt(proposalId);

                        if (proposalIdNum > Number(totalVoting) || proposalIdNum < 1) {
                                throw new Error(`Proposal ID ${proposalId} does not exist. Total proposals: ${totalVoting}`);
                        }

                        // Essayer de récupérer la proposition avec gestion d'erreur détaillée
                        let proposal;
                        try {
                                proposal = await contract.getProposal(proposalId);
                        } catch (contractError: any) {
                                // Si l'appel échoue, essayer avec une méthode alternative
                                throw new Error(`Proposal ${proposalId} not found or invalid. Contract returned: ${contractError.message || 'Unknown error'}`);
                        }

                        // Vérifier que la proposition retournée est valide
                        if (!proposal || proposal.id === undefined) {
                                throw new Error(`Proposal ${proposalId} exists but returned empty data`);
                        }

                        const now = Math.floor(Date.now() / 1000);
                        const isActive = proposal.status === 0 && Number(proposal.deadLine) > now;

                        // Gestion sécurisée des arrays qui peuvent être undefined
                        const vocesYes = proposal.vocesYes || [];
                        const vocesNo = proposal.vocesNo || [];

                        return {
                                id: proposal.id.toString(),
                                owner: proposal.owner || '0x0000000000000000000000000000000000000000',
                                status: proposal.status,
                                statusName: proposal.status === 0 ? 'Active' : proposal.status === 1 ? 'Executed' : 'Rejected',
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
                        // Retourner des informations détaillées sur l'erreur
                        return {
                                id: proposalId,
                                exists: false,
                                error: (error as Error).message,
                                suggestion: 'Try checking available proposal IDs with getActiveProposals first',
                        };
                }
        }

        // Vote on proposal - CORRIGÉ
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

                        // Vérifier si la proposition existe et est active
                        const proposal = await contract.getProposal(proposalId);
                        const now = Math.floor(Date.now() / 1000);

                        if (proposal.status !== 0) {
                                throw new Error(`Proposal is not active. Current status: ${proposal.status}`);
                        }

                        if (Number(proposal.deadLine) <= now) {
                                throw new Error('Proposal deadline has passed');
                        }

                        // Vérifier si l'utilisateur a déjà voté
                        const hasVoted = proposal.vocesYes.includes(walletAddress) || proposal.vocesNo.includes(walletAddress);
                        if (hasVoted) {
                                throw new Error('You have already voted on this proposal');
                        }

                        // Préparer les options de transaction
                        const txOptions = {
                                gasLimit: gasLimit,
                                gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
                        };

                        // Voter
                        const tx = await contract.vote(proposalId, voteChoice, txOptions);
                        const receipt = await tx.wait();

                        // Récupérer les informations mises à jour de la proposition
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

        // Check claims - CORRIGÉ
        private async checkClaims(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // Récupérer la liste des claims pour cet utilisateur
                        const claimsList = await contract.getClaimList(walletAddress, 1, 100);
                        const claimIds = claimsList[0]; // Les IDs des propositions
                        const claimStatuses = claimsList[1]; // Les statuts (true/false pour claimable)

                        const availableClaims = [];
                        let totalClaimable = BigInt(0);

                        for (let i = 0; i < claimIds.length; i++) {
                                if (claimStatuses[i]) { // Si claimable
                                        try {
                                                const proposal = await contract.getProposal(claimIds[i]);
                                                availableClaims.push({
                                                        proposalId: claimIds[i].toString(),
                                                        reward: ethers.formatEther(proposal.reward),
                                                        rewardWei: proposal.reward.toString(),
                                                        comment: proposal.comment,
                                                });
                                                totalClaimable += proposal.reward;
                                        } catch (err) {
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

        // Execute claim - CORRIGÉ
        private async executeClaim(
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

                        // Vérifier les claims disponibles
                        const claimsList = await contract.getClaimList(walletAddress, 1, 100);
                        const claimIds = claimsList[0];
                        const claimStatuses = claimsList[1];

                        const claimableIds = [];
                        for (let i = 0; i < claimIds.length; i++) {
                                if (claimStatuses[i]) {
                                        claimableIds.push(claimIds[i]);
                                }
                        }

                        if (claimableIds.length === 0) {
                                return {
                                        success: false,
                                        message: 'No rewards available to claim',
                                };
                        }

                        // Préparer les options de transaction
                        const txOptions = {
                                gasLimit: gasLimit,
                                gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
                        };

                        const claimResults = [];
                        let totalClaimed = BigInt(0);

                        // Claim chaque récompense
                        for (const claimId of claimableIds) {
                                try {
                                        const proposal = await contract.getProposal(claimId);
                                        const tx = await contract.claim(claimId, txOptions);
                                        const receipt = await tx.wait();

                                        claimResults.push({
                                                proposalId: claimId.toString(),
                                                transactionHash: tx.hash,
                                                reward: ethers.formatEther(proposal.reward),
                                                gasUsed: receipt?.gasUsed.toString(),
                                        });

                                        totalClaimed += proposal.reward;
                                } catch (err) {
                                        claimResults.push({
                                                proposalId: claimId.toString(),
                                                error: (err as Error).message,
                                        });
                                }
                        }

                        return {
                                success: true,
                                totalClaimed: ethers.formatEther(totalClaimed),
                                totalClaimedWei: totalClaimed.toString(),
                                claimsProcessed: claimResults.length,
                                claimResults,
                        };

                } catch (error) {
                        throw new Error(`Failed to execute claim: ${(error as Error).message}`);
                }
        }

        // Get voting power - CORRIGÉ
        private async getVotingPower(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // Récupérer les informations utilisateur
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

        // Get vote history - CORRIGÉ
        private async getVoteHistory(
                provider: ethers.JsonRpcProvider,
                walletAddress: string,
                contractAddress: string,
                contractABI: any[],
                options: any
        ): Promise<any> {
                const contract = new ethers.Contract(contractAddress, contractABI, provider);

                try {
                        // Récupérer toutes les propositions et vérifier dans lesquelles l'utilisateur a voté
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

                        // Trier par ID de proposition (plus récent en premier)
                        voteHistory.sort((a, b) => parseInt(b.proposalId) - parseInt(a.proposalId));

                        return {
                                totalVotes,
                                voteHistory: voteHistory.slice(0, 20), // Retourner les 20 plus récents
                        };

                } catch (error) {
                        throw new Error(`Failed to get vote history: ${(error as Error).message}`);
                }
        }

        // Get wallet balance
        private async getBalance(
                provider: ethers.JsonRpcProvider,
                walletAddress: string
        ): Promise<any> {
                try {
                        const balance = await provider.getBalance(walletAddress);
                        const blockNumber = await provider.getBlockNumber();

                        return {
                                balance: ethers.formatEther(balance),
                                balanceWei: balance.toString(),
                                blockNumber,
                                currency: 'CLO',
                        };

                } catch (error) {
                        throw new Error(`Failed to get balance: ${(error as Error).message}`);
                }
        }
}
