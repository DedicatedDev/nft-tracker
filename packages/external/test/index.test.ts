

import {
  Settings,
  CurveABI
} from "@evm/base";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";

describe("Curve", () => {
  let curveFactory: ContractFactory;
  let curve: Contract;
  let accounts: SignerWithAddress[];
  const BZZ = "0x19062190b1925b5b6689d7073fdfc8c2976ef8cb"
  const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f"

  before(async () => {
    accounts = await ethers.getSigners();
    curveFactory = await ethers.getContractFactory("BondingCurve")
    curve = await ethers.getContractAt(CurveABI.abi,"0x4F32Ab778e85C4aD0CEad54f8f82F5Ee74d46904") //await curveFactory.deploy(BZZ, DAI)
    await curve.deployed()
  });

  it("BONUS1:validate these inputs against a curve contract", async () => {
   // await curve.init()
    const bondedToken = await curve.bondedToken()
    console.log(bondedToken);
    const initialSupply = ethers.utils.parseEther("10")
    const requiredCollateral = await curve.requiredCollateral(10000)
    console.log(requiredCollateral)

  });


});
