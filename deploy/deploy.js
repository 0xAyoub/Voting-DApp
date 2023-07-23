const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("--------------------------------")
    arguments = []
    const Identification = await deploy("Voting", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmation: network.config.blockConfirmations
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN){
        log("Verifying...")
        await verify(Identification.address, arguments)
    }
}

module.exports.tags = ["all", "voting", "main"]