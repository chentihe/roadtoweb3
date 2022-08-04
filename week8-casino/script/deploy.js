const hre = require("hardhat");

async function main() {
    const Casino = await hre.ethers.getContractFactory("Casino");
    const casino = await Casino.deploy();

    await casino.deployed();

    console.log(`deployed to ${casino.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});