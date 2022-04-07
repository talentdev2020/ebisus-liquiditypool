const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const { Cro, LHRC } = hre.config.networks[hre.network.name];
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(LHRC, 100);

  //testnet 

  await liquidityPool.deployed();
  console.log("liquidityPool deployed to:", liquidityPool.address); 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
