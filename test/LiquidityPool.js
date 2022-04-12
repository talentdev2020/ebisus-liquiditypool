const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers, upgrades  } = require("hardhat");

describe("Test LiquidityPool contract", function () {
  let liquidityPoolFactory;
  let mockERC20Factory;

  let liquidityPool;
  let token1;
  let token2;
  let lpToken;
  let owner, other1, other2;
  before(async() => {
    accounts = await ethers.getSigners();
    [owner, other1, other2] = accounts;
    liquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");
    mockERC20Factory = await ethers.getContractFactory("MockERC20");
 })

  beforeEach(async function () {
    token2 = await mockERC20Factory.deploy("Token2", "Token2");
    await token2.deployed();
    await token2.transfer(other1.address, parseEther("1000"));
    
    // fee is 1%
    liquidityPool = await liquidityPoolFactory.deploy(token2.address, 100);
    await liquidityPool.deployed();
    
    await token2.approve(liquidityPool.address, parseEther("400"));
    await liquidityPool.initPool(parseEther("400"), {value: parseEther("100")});
   })

  // it("Should deposit and get LP", async function () {
  //   const reserves = await liquidityPool.getReserves();

  //   expect(reserves[0]).to.be.equal(parseEther("100"));
  //   expect(reserves[1]).to.be.equal(parseEther("400"));

  //   const balance = await liquidityPool.balanceOf(owner.address);
  //   expect(balance).to.be.equal(parseEther("200"));
  // });

  // it("Should add liquidity", async function () {
  //   await expect(liquidityPool.connect(other1).addLiquidity(parseEther('200'), {from: other1.address , value: parseEther("100")})).to.be.revertedWith("not enough allowance token2");

  //   await token2.connect(other1).approve(liquidityPool.address, parseEther("1000"));
  //   await expect(liquidityPool.connect(other1).addLiquidity(0, {value: parseEther("1")})).to.be.revertedWith("need non-zero values");
  //   await expect(liquidityPool.connect(other1).addLiquidity(parseEther("200"), {from: other1.address , value: parseEther("100")})).to.be.revertedWith("amounts not matched");

  //   await expect(liquidityPool.connect(other1).addLiquidity(parseEther("36"), {from: other1.address, value: parseEther("9")})).to.emit(liquidityPool, "NewLiquidity");
    
  //   const reserves = await liquidityPool.getReserves();

  //   expect(reserves[0]).to.be.equal(parseEther("109"));
  //   expect(reserves[1]).to.be.equal(parseEther("436"));

  //   const balance = await liquidityPool.balanceOf(other1.address);
  //   expect(balance).to.be.equal(parseEther("18"));
  // });
  
  // it("Should remove liquidity", async function () {
  //   await token2.connect(other1).approve(liquidityPool.address, parseEther("1000"));
  //   await liquidityPool.connect(other1).addLiquidity(parseEther("36"), {value: parseEther("9")});
    
  //   await expect(() => liquidityPool.connect(other1).removeLiquidity(20)).to.changeEtherBalance(other1, parseEther("1.8"));
  //   await expect(() => liquidityPool.connect(other1).removeLiquidity(25)).to.changeTokenBalance(token2, other1, parseEther("7.2"));

  //   const balance = await liquidityPool.balanceOf(other1.address);
  //   expect(balance).to.be.equal(parseEther("10.8"));
  // });

  it("Should swap token1 to token2", async function () {   
    const initBalance = await token2.balanceOf(other1.address);
    await expect(() => liquidityPool.connect(other1).swapOutOne({value: parseEther("4")})).to.changeEtherBalance(other1, parseEther("-4"));
    const afterBalance = await token2.balanceOf(other1.address);
    expect(afterBalance.sub(initBalance)).to.be.equal(parseEther("16").mul(99).div(100));
  });
 
  it("Should swap token2 to token1", async function () {
    await token2.approve(liquidityPool.address, parseEther("100"));
    
    const initBalance = await token2.balanceOf(owner.address);
    await expect(() => liquidityPool.swapOutTwo(parseEther("16"))).to.changeEtherBalance(liquidityPool, parseEther("4").mul(-99).div(100));
    const afterBalance = await token2.balanceOf(owner.address);
    expect(afterBalance.sub(initBalance)).to.be.equal(parseEther("-16"));
  });

  it("Should pay the rewards CRO", async function () {   
    await token2.connect(other1).approve(liquidityPool.address, parseEther("1000"));
    await liquidityPool.connect(other1).addLiquidity(parseEther("100"), {from: other1.address , value: parseEther("25")});

    await expect(liquidityPool.connect(other1).swapOutOne({from: other1.address , value: parseEther("200")})).to.be.revertedWith("not enough funds");    
    await liquidityPool.connect(other1).swapOutOne({from: other1.address , value: parseEther("100")});    
    
    await expect(() => liquidityPool.payoutRewards()).to.changeEtherBalance(owner, parseEther("1").mul(200).div(250))
    await expect(() => liquidityPool.connect(other1).payoutRewards()).to.changeEtherBalance(other1, parseEther("1").mul(50).div(250))
  });
 
  it("Should pay the rewards token2", async function () {   
    await token2.connect(other1).approve(liquidityPool.address, parseEther("1000"));
    await liquidityPool.connect(other1).addLiquidity(parseEther("100"), {from: other1.address , value: parseEther("25")});

    await liquidityPool.connect(other1).swapOutTwo(parseEther("100"));

    await expect(() => liquidityPool.payoutRewards()).to.changeTokenBalance(token2, owner, parseEther("1").mul(200).div(250))
    await expect(() => liquidityPool.connect(other1).payoutRewards()).to.changeTokenBalance(token2, other1, parseEther("1").mul(50).div(250))
  });
}); 

