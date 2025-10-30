import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ERC20Mock, TokenPurchase } from "../typechain-types";

describe("TokenPurchase", function () {
    let usdt: ERC20Mock;
    let tokenPurchase: TokenPurchase;
    let owner: Signer, user: Signer, anotherUser: Signer;
    const USDT_DECIMALS = 6;

    const toUSDT = (amount: string) => ethers.parseUnits(amount, USDT_DECIMALS);

    beforeEach(async () => {
        [owner, user, anotherUser] = await ethers.getSigners();

        // Deploy mock USDT
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        usdt = await ERC20Mock.deploy(
            "Mock USDT",
            "USDT",
            await owner.getAddress(),
            ethers.parseUnits("1000000", 6), // 1 million USDT
            6
        );


        // Transfer some USDT to user
        await usdt.transfer(await user.getAddress(), toUSDT("100"));
        await usdt.transfer(await anotherUser.getAddress(), toUSDT("50"));

        // Deploy the TokenPurchase contract
        const TokenPurchase = await ethers.getContractFactory("TokenPurchase");
        tokenPurchase = await TokenPurchase.deploy((await usdt.getAddress()));
    });

    it("should allow purchase and emit event", async () => {
        const purchaseAmount = toUSDT("10");

        await usdt.connect(user).approve((await tokenPurchase.getAddress()), purchaseAmount);

        await expect(tokenPurchase.connect(user).buyTokens(purchaseAmount))
            .to.emit(tokenPurchase, "Purchase")
            .withArgs(await user.getAddress(), purchaseAmount, 10);
    });

    it("should revert if USDT not approved", async () => {
        const purchaseAmount = toUSDT("5");

        try {
            await tokenPurchase.connect(user).buyTokens(purchaseAmount);
            expect.fail("Expected transaction to revert");
        } catch (err: any) {
            console.log("Revert reason:", err);
            expect(err.message).to.include("ERC20InsufficientAllowance"); // Optional assertion
        }
    });

    it("should revert if payment too small", async () => {
        const smallAmount = toUSDT("0.5");

        await usdt.connect(user).approve((await tokenPurchase.getAddress()), smallAmount);

        await expect(tokenPurchase.connect(user).buyTokens(smallAmount))
            .to.be.revertedWith("Too little sent");
    });

    it("should allow only owner to withdraw", async () => {
        const amount = 10n * 10n ** 6n;
        await usdt.connect(user).approve((await tokenPurchase.getAddress()), amount);
        await tokenPurchase.connect(user).buyTokens(amount);

        const ownerBefore = await usdt.balanceOf(await owner.getAddress());

        await expect(tokenPurchase.connect(owner).withdrawUSDT())
            .to.not.be.reverted;

        const ownerAfter = await usdt.balanceOf(await owner.getAddress());
        expect(ownerAfter - ownerBefore).to.equal(amount);
    });

    it("should revert withdraw from non-owner", async () => {
        await expect(tokenPurchase.connect(user).withdrawUSDT())
            .to.be.revertedWith("Only owner");
    });

    it("should allow owner to update token price", async () => {
        const newPrice = toUSDT("2");

        await tokenPurchase.connect(owner).setTokenPrice(newPrice);
        const updatedPrice = await tokenPurchase.tokenPrice();
        expect(updatedPrice).to.equal(newPrice);
    });

    it("should revert price update from non-owner", async () => {
        const newPrice = toUSDT("2");

        await expect(tokenPurchase.connect(user).setTokenPrice(newPrice))
            .to.be.revertedWith("Only owner");
    });
});
