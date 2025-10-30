import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GunDriveTokenModule = buildModule("GunDriveTokenModule", (m) => {
  const initialHolder = m.getAccount(0);

  const GUNDTOKEN = m.contract("GUND", [
    100000000,
    10
  ]);

  return { GUNDTOKEN };
});

export default GunDriveTokenModule;
