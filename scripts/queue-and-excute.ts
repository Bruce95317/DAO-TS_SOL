import { developmentChains, FUNC, MIN_DELAY, NEW_STORE_VALUE, PROPOSAL_DESCRIPTION } from "../helper-hardhat-config";
import { ethers, network } from "hardhat";
import { moveTime } from "../utils/move-time";
import { moveBlocks } from "../utils/move-blocks";

export async function queueAndExecute() {
    const args = [NEW_STORE_VALUE];
    const box = await ethers.getContract("Box");
    const encodedFunctionCall = box.interface.encodedFunctionCall(FUNC, args);
    const descriptionhash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION)
    );
    const governor = await ethers.getContract("GovernorContract");
    console.log("Queuing...");
    const queueTx = governor.queue([box.address], [0], [encodedFunctionCall], descriptionhash);
    await queueTx.wait(1);

    if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);
    }
    console.log("executing...")
    const executeTx = await governor.execute(
        [box.address],
        [0],
        [encodedFunctionCall],
        descriptionhash
    );
    await executeTx.wait(1);

    const boxNewValue = await box.retrieve()
    console.log(`New Box Value: ${boxNewValue.toString()}`);
}

queueAndExecute().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
})