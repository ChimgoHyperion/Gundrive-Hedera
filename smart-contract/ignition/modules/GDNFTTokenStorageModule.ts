import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GDNFTTokenStorageModule = buildModule("GDNFTTokenStorageModule", (m) => {
  const initialHolder = m.getAccount(0);

  const GDNFTTOKEN = m.contract("GDNFTStorage", [
    "Gun Drive NFT",
    "GD"
  ]);

  return { GDNFTTOKEN };
});

export default GDNFTTokenStorageModule;
