# GunDrive (GUND) - Blockchain Token & NFT Ecosystem

A comprehensive blockchain project featuring a custom ERC20 token (GUND) and ERC721 NFT collection (GDNFT), currently deployed on Hedera Testnet with support for multiple networks.

## 🚀 Project Overview

GunDrive is a multi-chain blockchain ecosystem consisting of:

- **GUND Token**: A capped, burnable ERC20 token with owner-controlled minting
- **GDNFT Collection**: An ERC721 NFT collection with advanced ownership tracking
- **Multi-Chain Support**: Currently deployed on Hedera Testnet, with configuration for Polygon and AssetChain networks

## 📋 Features

### GUND Token (ERC20)
- **Capped Supply**: Maximum supply of 100,000,000 tokens
- **Burnable**: Tokens can be permanently destroyed
- **Owner-Controlled**: Only contract owner can mint new tokens
- **Block Rewards**: Configurable block reward system (currently disabled)
- **Initial Distribution**: 70,000,000 tokens minted to owner on deployment

### GDNFT Collection (ERC721)
- **URI Storage**: Each NFT can have unique metadata URI
- **Batch Minting**: Owner can mint multiple NFTs in a single transaction
- **Ownership Tracking**: Efficient tracking of tokens per owner
- **Enumerable Functions**: Get all tokens owned by an address
- **Owner-Only Minting**: Only contract owner can create new NFTs

## 🛠️ Technology Stack

- **Solidity**: ^0.8.20
- **Hardhat**: Development framework
- **OpenZeppelin**: Secure smart contract libraries
- **TypeScript**: Type-safe development
- **Ethers.js**: Ethereum interaction library
- **Chai**: Testing framework

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gun-Drive/smart-contract.git
   cd sc-newer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   ASSETCHAIN_API_KEY=your_assetchain_api_key
   HEDERA_RPC_URL=your_hedera_rpc_url
   HEDERA_PRIVATE_KEY=your_hedera_private_key
   ```

## 🚀 Deployment

### Deploy to Local Network
```bash
npx hardhat node
npx hardhat ignition deploy ignition/modules/GunDriveTokenModule.ts --network localhost
npx hardhat ignition deploy ignition/modules/GDNFTTokenModule.ts --network localhost
```

### Deploy to Hedera Testnet (Currently Active)
```bash
npx hardhat ignition deploy ignition/modules/GunDriveTokenModule.ts --network hedera_testnet
npx hardhat ignition deploy ignition/modules/GDNFTTokenModule.ts --network hedera_testnet
```

## 🧪 Testing

Run the test suite:
```bash
npx hardhat test
```

Run tests with gas reporting:
```bash
REPORT_GAS=true npx hardhat test
```

## 📊 Contract Addresses

### Currently Deployed on Hedera Testnet
- **GUND Token**: `0x8A4B3FC60024fAcd4c665C0a0C15Abd26Bc079Af`
- **GDNFT Collection**: `0xA63Dd56CD17f73D19A84557C6931414c01247468`
- **GDNFT Storage**: `0xF09aC86286Ee1270ABdf8a8Ec7fC32de1Ab01cE3`

### Previous Deployments (Polygon)
- **GUND Token**: `0x29d31d9A40005439Dc029D1505f7d34e6872A515`
- **GDNFT Collection**: `0xD11883FBf77FA649B9baaE9dC5559eAAFAf150bC`

## 🔧 Usage Examples

### Interacting with GUND Token
```javascript
// Get token balance
const balance = await gundToken.balanceOf(userAddress);

// Transfer tokens
await gundToken.transfer(recipientAddress, amount);

// Burn tokens
await gundToken.burn(amount);

// Set block reward (owner only)
await gundToken.setBlockReward(newReward);
```

### Interacting with GDNFT Collection
```javascript
// Mint a new NFT
await gdnft.mint(recipientAddress, "ipfs://metadata-uri");

// Batch mint multiple NFTs
await gdnft.batchMint(recipients, tokenURIs);

// Get all tokens owned by an address
const ownedTokens = await gdnft.tokensOfOwner(ownerAddress);

// Get token count for an address
const tokenCount = await gdnft.tokenCountOf(ownerAddress);

// Get token at specific index
const tokenId = await gdnft.tokenOfOwnerByIndex(ownerAddress, index);
```

## 🌐 Supported Networks

| Network | Chain ID | RPC URL | Explorer | Status |
|---------|----------|---------|----------|---------|
| Hedera Testnet | 296 | https://testnet.hashio.io/api | https://hashscan.io/testnet | ✅ **Currently 

## 🔒 Security Features

- **OpenZeppelin Standards**: All contracts use battle-tested OpenZeppelin libraries
- **Access Control**: Owner-only functions for critical operations
- **Input Validation**: Comprehensive checks for all user inputs
- **Reentrancy Protection**: Safe external calls
- **Gas Optimization**: Efficient storage and computation patterns

## 📝 Contract Specifications

### GUND Token
- **Name**: GUN DRIVE
- **Symbol**: GUND
- **Decimals**: 18
- **Total Supply Cap**: 100,000,000 tokens
- **Initial Owner Supply**: 70,000,000 tokens
- **Block Reward**: Configurable by owner (currently disabled)

### GDNFT Collection
- **Name**: Gun Drive NFT
- **Symbol**: GD
- **Token Standard**: ERC721 with URI storage
- **Minting**: Owner-only with custom URI support
- **Features**: Batch minting, ownership tracking, enumerable functions

## 🏗️ Project Structure

```
sc-newer/
├── contracts/           # Smart contracts
│   ├── GUND.sol        # ERC20 token contract
│   └── GDNFTStorage.sol # ERC721 NFT contract
├── ignition/           # Deployment modules
│   └── modules/
│       ├── GunDriveTokenModule.ts
│       └── GDNFTTokenModule.ts
├── test/               # Test files
├── scripts/            # Utility scripts
└── artifacts/          # Compiled contracts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔄 Version History

- **v1.0.0**: Initial release with GUND token and GDNFT collection
- **v1.1.0**: Multi-chain deployment support
- **v1.2.0**: Enhanced NFT ownership tracking and batch minting

---

**⚠️ Disclaimer**: This is a development project. Always audit smart contracts before deploying to mainnet and use at your own risk.