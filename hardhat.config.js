require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-gas-reporter")
require("solidity-coverage")

const INFURA = process.env.INFURA || "";
const PK = process.env.PK || "";
const ETHERSCAN = process.env.ETHERSCAN || "";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: INFURA,
      accounts: [`0x${PK}`],
      chainId: 5,
      blockConfirmations: 6
    }
  },
  etherscan: {
    apiKey: {
      goerli: ETHERSCAN,
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17"
      }
    ]
  },
  gasReporter: {
    enabled: true,
  },
};
