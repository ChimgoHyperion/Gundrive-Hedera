# Gundrive - Play-to-Earn Gaming on Hedera

## Project Track
Gaming & NFTs Track

## 🏅 Certification

- **[Chimgozirim Amadi (Hyperion)]-(https://drive.google.com/file/d/178dk7c36EbWRUgWVBbSAL04zjBKAu8ki/view?usp=drive_link)**  
- **[Joy Chukwuma]-(https://drive.google.com/file/d/1vRPyJuJvQqTo2hLr8hOgNFErv6Qa20FZ/view?usp=drive_link)**

## Pitch Deck
- **(https://www.canva.com/design/DAG2_2_94QU/axn3JcGJtQXRCTcJRy521w/view?utm_content=DAG2_2_94QU&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h0584680fba#7)**

## Project Overview
Gundrive is an action-packed multiplayer game built on Unity that integrates Hedera's blockchain technology for in-game asset management and tokenomics. Players can earn GUND tokens through gameplay and collect unique NFT weapons represented as smart contracts on the Hedera network. For more details about the game mechanics and features, see the [Game Documentation](https://github.com/ChimgoHyperion/Gundrive-Hedera/blob/main/Game/README.md)

## Hedera Integration Summary

### Hedera Token Service (HTS)
We utilize HTS for our native GUND token implementation. The token serves as the in-game currency and reward mechanism, leveraging Hedera's predictable $0.0001 fee structure to ensure sustainable token economics. Our GUND token (implemented as an ERC20-compatible token) enables:
- Player rewards for achievements
- In-game purchases
- Trading between players

### Hedera Smart Contract Service
We use Hedera smart contracts for:
- NFT weapon management (GDNFTStorage contract)
- Token distribution and rewards (GUND token contract)
- Game asset ownership verification

Transaction Types:
- Token transfers (HTS)
- NFT minting
- Smart contract calls for game logic
- Token balance checks

Economic Justification:
The combination of Hedera's low transaction fees and high throughput enables:
- Microtransactions for in-game rewards without high gas fees
- Instant finality for real-time gameplay rewards
- Cost-effective NFT minting and trading

## Architecture Diagram
```
[Player/Unity Client]
       
[Game Server (Node.js)]
             
[GUND Token]  [NFT Contract]
                
    [Hedera Network]
          
    [Mirror Nodes]
```
![alt text](<GunDrive Architecture.drawio (2).png>)

## Deployed Hedera IDs (Testnet)
- GUND Token Contract: 0xF09aC86286Ee1270ABdf8a8Ec7fC32de1Ab01cE3 [0.0.6904416-xnxaj]
- NFT Storage Contract: 0x8A4B3FC60024fAcd4c665C0a0C15Abd26Bc079Af [0.0.6896565-bwpxm]
- Game Server Marketplace Account ID:0xFaD217d48BdFc58d62B7b46b936810B48790aF71 [0.0.7150510-xbfai]

## Setup Instructions

### Prerequisites
- Unity 2022.3 or later
- Node.js 16.x or later
- Hedera testnet account
- Git

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ChimgoHyperion/Gundrive-Hedera.git
cd Gundrive-Hedera
```

2. Server Setup:
```bash
cd server
cp env.example .env  # Configure with your credentials
npm install
npm start
```

3. Smart Contract Setup:
```bash
cd smart-contract
npm install
cp .env.example .env  # Configure with your Hedera credentials
npx hardhat compile
```

4. Unity Game Setup:
- Open Unity Hub
- Add the project from the `game` directory
- Open the project
- Configure Hedera connection settings in the Unity Inspector

### Environment Configuration

Server `.env` example:
```env
PORT=3001
RPC_URL=YOUR_HEDERA_RPC_URL
MARKETPLACE_PRIVATE_KEY=YOUR_PRIVATE_KEY
TOKEN_ADDRESS=0xF09aC86286Ee1270ABdf8a8Ec7fC32de1Ab01cE3
ALLOWED_ORIGIN=*
```

Smart Contract `.env` example:
```env
DEPLOYER_PRIVATE_KEY=YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet
```

## Running the Project

1. Start the server:
```bash
cd server
npm start
```

2. Deploy contracts (if needed):
```bash
cd smart-contract
npx hardhat run scripts/deploy.js --network testnet
```

3. Open Unity project:
- Launch Unity Hub
- Open the GunDrive project
- Press Play in the Unity Editor

## Code Structure
```
 game/                 # Unity game client
    Assets/          # Game assets and scripts
    README.md        # Unity-specific setup
 server/              # Game server
    index.js         # Server entry point
    package.json     # Server dependencies
 smart-contract/      # Hedera smart contracts
     contracts/       # Solidity contracts
     hardhat.config.ts # Contract deployment config
```

## Security Considerations
- All private keys are managed through environment variables
- Server endpoints implement proper validation
- Smart contracts use OpenZeppelin's secure base contracts
- Token transfers require proper authentication

## Testing
Run smart contract tests:
```bash
cd smart-contract
npx hardhat test
```

## For Judges
Test credentials will be provided in the DoraHacks submission text field, including:
- Testnet Account ID
- Test wallet private key
- Test user credentials

## Code Quality & Auditability
- Consistent code style across all components
- Clear function naming conventions
- ESLint configuration for JavaScript/TypeScript
- Comprehensive inline documentation
- Git commit history follows conventional commits
