import { ethers, network } from "hardhat"
import {
    developmentChains,
    VOTING_DELAY,
    proposalsFile,
    FUNC,
    PROPOSAL_DESCRIPTION,
    NEW_STORE_VALUE,
} from "../helper-hardhat-config"
import * as fs from "fs"
import { moveBlocks } from "../utils/move-blocks"

export async function propose(args: any[], functionToCall: string, proposalDescription: string) {
    const governor = await ethers.getContract("GovernorContract")
    const box = await ethers.getContract("Box")
    const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args)
    console.log(`Proposing ${functionToCall} on ${box.address} with ${args}`)
    console.log(`Proposal Description:\n  ${proposalDescription}`)
    const proposeTx = await governor.propose(
        [box.address],
        [0],
        [encodedFunctionCall],
        proposalDescription
    )
    // If working on a development chain, we will push forward till we get to the voting period.
    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1)
    }
    const proposeReceipt = await proposeTx.wait(1)
    const proposalId = proposeReceipt.events[0].args.proposalId
    console.log(`Proposed with proposal ID:\n  ${proposalId}`)

    const proposalState = await governor.state(proposalId)
    console.log("Proceed to voting")

    // save the proposalId
    let proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"))
    proposals[network.config.chainId!.toString()].push(proposalId.toString())
    fs.writeFileSync(proposalsFile, JSON.stringify(proposals))
}

propose([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })