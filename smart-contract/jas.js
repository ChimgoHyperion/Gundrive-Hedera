/**
 * Hedera NFT Smart Contract Event Indexer
 * Monitors NFT smart contract events and builds an index of NFT ownership
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

class HederaNFTEventIndexer {
    constructor(contractAddress, network = 'testnet', options = {}) {
        this.contractAddress = contractAddress;
        this.network = network;
        
        // Mirror Node endpoints
        this.endpoints = {
            mainnet: 'https://mainnet-public.mirrornode.hedera.com',
            testnet: 'https://testnet.mirrornode.hedera.com',
            previewnet: 'https://previewnet.mirrornode.hedera.com'
        };
        
        this.baseUrl = this.endpoints[network];
        
        // Configuration
        this.config = {
            pollInterval: options.pollInterval || 5000, // 5 seconds
            batchSize: options.batchSize || 100,
            maxRetries: options.maxRetries || 3,
            startTimestamp: options.startTimestamp || null,
            enableRealTime: options.enableRealTime || false,
            ...options
        };
        
        // NFT ownership index
        this.nftIndex = new Map(); // tokenId -> owner mapping
        this.ownerIndex = new Map(); // owner -> Set of tokenIds
        this.eventHistory = []; // Complete event history
        this.lastProcessedTimestamp = this.config.startTimestamp;
        
        // Event signatures for common NFT events
        this.eventSignatures = {
            // ERC-721 Transfer event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
            Transfer: crypto.createHash('sha256').update('Transfer(address,address,uint256)').digest('hex').substring(0, 8),
            // ERC-721 Approval event: Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)  
            Approval: crypto.createHash('sha256').update('Approval(address,address,uint256)').digest('hex').substring(0, 8),
            // ERC-721 ApprovalForAll event: ApprovalForAll(address indexed owner, address indexed operator, bool approved)
            ApprovalForAll: crypto.createHash('sha256').update('ApprovalForAll(address,address,bool)').digest('hex').substring(0, 8),
            // Custom mint event (customize based on your contract)
            Mint: crypto.createHash('sha256').update('Mint(address,uint256,string)').digest('hex').substring(0, 8)
        };
        
        // Generate proper keccak256 signatures
        this.properEventSignatures = {
            Transfer: ethers.utils.id('Transfer(address,address,uint256)'),
            Approval: ethers.utils.id('Approval(address,address,uint256)'),
            ApprovalForAll: ethers.utils.id('ApprovalForAll(address,address,bool)'),
            Mint: ethers.utils.id('Mint(address,uint256,string)')
        };
        
        this.isRunning = false;
    }

    /**
     * Start the indexer
     */
    async start() {
        console.log(`Starting Hedera NFT Event Indexer for contract: ${this.contractAddress}`);
        this.isRunning = true;
        
        // Initialize with historical data if no start timestamp provided
        if (!this.lastProcessedTimestamp) {
            await this.indexHistoricalEvents();
        }
        
        // Start real-time monitoring
        if (this.config.enableRealTime) {
            this.startRealtimeMonitoring();
        }
        
        console.log('Indexer started successfully');
        return this.getStats();
    }

    /**
     * Stop the indexer
     */
    stop() {
        console.log('Stopping NFT Event Indexer...');
        this.isRunning = false;
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
    }

    /**
     * Index historical events from the contract
     */
    async indexHistoricalEvents(fromTimestamp = null, toTimestamp = null) {
        console.log('Indexing historical events...');
        
        const startTime = fromTimestamp || this.getTimestamp30DaysAgo();
        const endTime = toTimestamp || this.getCurrentTimestamp();
        
        let currentTime = startTime;
        const sevenDaysInNanos = 7 * 24 * 60 * 60 * 1000000000; // 7 days in nanoseconds
        
        while (currentTime < endTime && this.isRunning) {
            const batchEndTime = Math.min(currentTime + sevenDaysInNanos, endTime);
            
            try {
                await this.indexEventBatch(currentTime, batchEndTime);
                currentTime = batchEndTime;
                
                // Small delay to avoid rate limiting
                await this.sleep(200);
                
            } catch (error) {
                console.error(`Error indexing batch ${currentTime} to ${batchEndTime}:`, error);
                currentTime = batchEndTime; // Skip this batch and continue
            }
        }
        
        this.lastProcessedTimestamp = endTime;
        console.log(`Historical indexing completed. Processed up to: ${new Date(endTime / 1000000)}`);
    }

    /**
     * Index events for a specific time range
     */
    async indexEventBatch(startTime, endTime) {
        // Get Transfer events (most important for NFT ownership)
        const transferEvents = await this.getContractLogs(
            this.properEventSignatures.Transfer,
            startTime,
            endTime
        );
        
        // Process Transfer events
        for (const event of transferEvents) {
            await this.processTransferEvent(event);
        }
        
        // Get other events (Approval, Mint, etc.) if needed
        const approvalEvents = await this.getContractLogs(
            this.properEventSignatures.Approval,
            startTime,
            endTime
        );
        
        for (const event of approvalEvents) {
            await this.processApprovalEvent(event);
        }
        
        console.log(`Processed ${transferEvents.length} Transfer events and ${approvalEvents.length} Approval events`);
    }

    /**
     * Get contract logs from Mirror Node API
     */
    async getContractLogs(topic, startTime, endTime, limit = 100) {
        const url = `${this.baseUrl}/api/v1/contracts/${this.contractAddress}/results/logs` +
                   `?topic0=${topic}` +
                   `&timestamp=gte:${startTime}` +
                   `&timestamp=lt:${endTime}` +
                   `&limit=${limit}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.logs || [];
            
        } catch (error) {
            console.error(`Error fetching contract logs:`, error);
            return [];
        }
    }

    /**
     * Process Transfer event
     */
    async processTransferEvent(event) {
        try {
            const { topics, data, timestamp, transaction_hash } = event;
            
            if (topics.length < 4) {
                console.warn('Invalid Transfer event - insufficient topics');
                return;
            }
            
            // Decode Transfer event
            // topics[0] = event signature
            // topics[1] = from address (indexed)
            // topics[2] = to address (indexed)  
            // topics[3] = tokenId (indexed)
            
            const from = this.decodeAddress(topics[1]);
            const to = this.decodeAddress(topics[2]);
            const tokenId = this.decodeUint256(topics[3]);
            
            // Update ownership index
            this.updateOwnership(from, to, tokenId, timestamp, transaction_hash);
            
            // Add to event history
            this.eventHistory.push({
                type: 'Transfer',
                from,
                to,
                tokenId,
                timestamp,
                transaction_hash,
                blockTime: new Date(parseInt(timestamp) / 1000000)
            });
            
        } catch (error) {
            console.error('Error processing Transfer event:', error);
        }
    }

    /**
     * Process Approval event
     */
    async processApprovalEvent(event) {
        try {
            const { topics, data, timestamp, transaction_hash } = event;
            
            if (topics.length < 4) return;
            
            const owner = this.decodeAddress(topics[1]);
            const approved = this.decodeAddress(topics[2]);
            const tokenId = this.decodeUint256(topics[3]);
            
            this.eventHistory.push({
                type: 'Approval',
                owner,
                approved,
                tokenId,
                timestamp,
                transaction_hash,
                blockTime: new Date(parseInt(timestamp) / 1000000)
            });
            
        } catch (error) {
            console.error('Error processing Approval event:', error);
        }
    }

    /**
     * Update ownership index
     */
    updateOwnership(from, to, tokenId, timestamp, txHash) {
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        
        // Remove from previous owner (if not mint)
        if (from !== zeroAddress) {
            const fromOwned = this.ownerIndex.get(from) || new Set();
            fromOwned.delete(tokenId);
            if (fromOwned.size === 0) {
                this.ownerIndex.delete(from);
            } else {
                this.ownerIndex.set(from, fromOwned);
            }
        }
        
        // Add to new owner (if not burn)
        if (to !== zeroAddress) {
            const toOwned = this.ownerIndex.get(to) || new Set();
            toOwned.add(tokenId);
            this.ownerIndex.set(to, toOwned);
            this.nftIndex.set(tokenId, {
                owner: to,
                lastTransfer: timestamp,
                lastTxHash: txHash
            });
        } else {
            // Token burned
            this.nftIndex.delete(tokenId);
        }
    }

    /**
     * Start real-time monitoring
     */
    startRealtimeMonitoring() {
        console.log('Starting real-time event monitoring...');
        
        this.pollTimer = setInterval(async () => {
            if (!this.isRunning) return;
            
            try {
                const currentTime = this.getCurrentTimestamp();
                const fromTime = this.lastProcessedTimestamp || (currentTime - (this.config.pollInterval * 1000000));
                
                await this.indexEventBatch(fromTime, currentTime);
                this.lastProcessedTimestamp = currentTime;
                
            } catch (error) {
                console.error('Error in real-time monitoring:', error);
            }
        }, this.config.pollInterval);
    }

    /**
     * Get NFTs owned by a specific address
     */
    getNFTsOwnedBy(ownerAddress) {
        const owned = this.ownerIndex.get(ownerAddress.toLowerCase());
        if (!owned) return [];
        
        return Array.from(owned).map(tokenId => ({
            tokenId,
            owner: ownerAddress,
            ...this.nftIndex.get(tokenId)
        }));
    }

    /**
     * Get owner of a specific NFT
     */
    getOwnerOf(tokenId) {
        const nftInfo = this.nftIndex.get(tokenId);
        return nftInfo ? nftInfo.owner : null;
    }

    /**
     * Get all NFTs in the collection
     */
    getAllNFTs() {
        const allNFTs = [];
        for (const [tokenId, info] of this.nftIndex.entries()) {
            allNFTs.push({
                tokenId,
                ...info
            });
        }
        return allNFTs;
    }

    /**
     * Get transfer history for a specific NFT
     */
    getTransferHistory(tokenId) {
        return this.eventHistory.filter(event => 
            event.type === 'Transfer' && event.tokenId === tokenId
        ).sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    }

    /**
     * Get indexer statistics
     */
    getStats() {
        return {
            totalNFTs: this.nftIndex.size,
            totalOwners: this.ownerIndex.size,
            totalEvents: this.eventHistory.length,
            lastProcessedTimestamp: this.lastProcessedTimestamp,
            lastProcessedDate: this.lastProcessedTimestamp ? 
                new Date(parseInt(this.lastProcessedTimestamp) / 1000000) : null,
            isRunning: this.isRunning,
            contractAddress: this.contractAddress,
            network: this.network
        };
    }

    /**
     * Export current index state
     */
    exportIndex() {
        return {
            nftIndex: Object.fromEntries(this.nftIndex),
            ownerIndex: Object.fromEntries(
                Array.from(this.ownerIndex.entries()).map(([k, v]) => [k, Array.from(v)])
            ),
            eventHistory: this.eventHistory,
            lastProcessedTimestamp: this.lastProcessedTimestamp,
            stats: this.getStats()
        };
    }

    /**
     * Import index state
     */
    importIndex(indexData) {
        this.nftIndex = new Map(Object.entries(indexData.nftIndex));
        this.ownerIndex = new Map(
            Object.entries(indexData.ownerIndex).map(([k, v]) => [k, new Set(v)])
        );
        this.eventHistory = indexData.eventHistory || [];
        this.lastProcessedTimestamp = indexData.lastProcessedTimestamp;
        
        console.log('Index imported successfully:', this.getStats());
    }

    // Utility methods
    decodeAddress(topic) {
        // Remove 0x prefix and pad to 64 chars, then take last 40 chars for address
        const hex = topic.replace('0x', '').padStart(64, '0');
        return '0x' + hex.slice(-40).toLowerCase();
    }

    decodeUint256(topic) {
        return parseInt(topic, 16).toString();
    }

    getCurrentTimestamp() {
        return Date.now() * 1000000; // Convert to nanoseconds
    }

    getTimestamp30DaysAgo() {
        return (Date.now() - (30 * 24 * 60 * 60 * 1000)) * 1000000;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Usage example and testing
async function demonstrateIndexer() {
    // Example NFT contract address (replace with your contract)
    const contractAddress = '0.0.123456'; // Your Hedera contract ID
    
    const indexer = new HederaNFTEventIndexer(contractAddress, 'testnet', {
        enableRealTime: true,
        pollInterval: 10000, // 10 seconds
        startTimestamp: null // Will index from 30 days ago
    });
    
    try {
        // Start indexing
        console.log('Starting indexer...');
        await indexer.start();
        
        // Wait a bit for initial indexing
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check stats
        console.log('Indexer Stats:', indexer.getStats());
        
        // Get NFTs for a specific owner
        const ownerAddress = '0x1234567890123456789012345678901234567890';
        const ownedNFTs = indexer.getNFTsOwnedBy(ownerAddress);
        console.log(`NFTs owned by ${ownerAddress}:`, ownedNFTs);
        
        // Get all NFTs
        const allNFTs = indexer.getAllNFTs();
        console.log(`Total NFTs in collection: ${allNFTs.length}`);
        
        // Get transfer history for a specific NFT
        if (allNFTs.length > 0) {
            const tokenId = allNFTs[0].tokenId;
            const history = indexer.getTransferHistory(tokenId);
            console.log(`Transfer history for NFT ${tokenId}:`, history);
        }
        
        // Export current state
        const indexState = indexer.exportIndex();
        console.log('Current index state exported');
        
        // Stop after demo (in real app, keep running)
        setTimeout(() => {
            indexer.stop();
            console.log('Demo completed');
        }, 30000); // Stop after 30 seconds
        
    } catch (error) {
        console.error('Error in demonstration:', error);
        indexer.stop();
    }
}

// Lightweight query functions for quick access
class NFTQueryInterface {
    constructor(indexer) {
        this.indexer = indexer;
    }
    
    async getWalletNFTs(walletAddress) {
        return this.indexer.getNFTsOwnedBy(walletAddress);
    }
    
    async getNFTCount(walletAddress) {
        const nfts = this.indexer.getNFTsOwnedBy(walletAddress);
        return nfts.length;
    }
    
    async getCollectionStats() {
        return this.indexer.getStats();
    }
    
    async getNFTOwner(tokenId) {
        return this.indexer.getOwnerOf(tokenId);
    }
    
    async searchNFTsByOwner(ownerPattern) {
        const results = [];
        for (const [owner, tokens] of this.indexer.ownerIndex.entries()) {
            if (owner.toLowerCase().includes(ownerPattern.toLowerCase())) {
                results.push({
                    owner,
                    tokenCount: tokens.size,
                    tokens: Array.from(tokens)
                });
            }
        }
        return results;
    }
}

// Export for Node.js modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        HederaNFTEventIndexer, 
        NFTQueryInterface, 
        demonstrateIndexer 
    };
}

// Browser usage:
const indexer = new HederaNFTEventIndexer('0.0.6896561', 'testnet');
await indexer.start();
const myNFTs = indexer.getNFTsOwnedBy('0x19219ab0E7DBbA5B887A1f2Dc6EC3C0D10576628');