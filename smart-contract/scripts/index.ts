
// scripts/getTokenDetails.ts
import { ethers } from "hardhat";
import { GDNFTStorage } from "../typechain-types";

async function getTokenDetails(tokenId: number | string): Promise<void> {
    const contractAddress = "0xF09aC86286Ee1270ABdf8a8Ec7fC32de1Ab01cE3";

    try {
        const contract: GDNFTStorage = await ethers.getContractAt("GDNFTStorage", contractAddress);

        console.log(`=== Token ${tokenId} Details ===`);

        const owner = await contract.ownerOf(tokenId);
        const tokenURI = await contract.tokenURI(tokenId);

        console.log(`Token ID: ${tokenId}`);
        console.log(`Owner: ${owner}`);
        console.log(`Token URI: ${tokenURI}`);

        // Check if owner has other tokens


    } catch (error: any) {
        if (error.reason === "ERC721: invalid token ID") {
            console.log(`Token ${tokenId} does not exist`);
        } else {
            console.error("Error:", error.message);
        }
    }
}

// Usage example - you can call this with different token IDs
async function main(): Promise<void> {
    const contractAddress = "0xF09aC86286Ee1270ABdf8a8Ec7fC32de1Ab01cE3";

    const contract: GDNFTStorage = await ethers.getContractAt("GDNFTStorage", contractAddress);

    const tokenIds = await contract.tokensOfOwner("0x19219ab0E7DBbA5B887A1f2Dc6EC3C0D10576628");
    console.log(`Owner's other tokens: [${tokenIds.map(id => id.toString()).join(', ')}]`);
    for (const tokenId of tokenIds) {
        await getTokenDetails(tokenId.toString());
        console.log(""); // Add spacing between tokens
    }
}

// Uncomment to run
main()
    .then(() => process.exit(0))
    .catch((error: Error) => {
        console.error(error);
        process.exit(1);
    });