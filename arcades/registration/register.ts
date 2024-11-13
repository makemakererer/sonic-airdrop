import axios from "axios";
import { getSmartWallet, randomDelay } from "../../utils/helpers";
import { MaxUint256, Wallet } from "ethers";
import { Config, log, MAX_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES, MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES } from "../../utils/config";
import { approveABI } from "../../utils/approveABI";
import { createSession } from "./session";

export const register = async (sessionId: number, walletAddress: string, permitSignature: string, hashKey: string, config: Config, workerLogInfo: string, retries = 2): Promise<string> => {
	await randomDelay(MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES);
	const data = approveABI.encodeFunctionData("approve", ["0x67886Cf1798D5010Cc11B0F380b0a43D0023A381", MaxUint256]);

	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				jsonrpc: "2.0",
				id: 0x7,
				method: "call",
				params: {
					call: {
						dest: "0x4Cc7b0ddCD0597496E57C5325cf4c73dBA30cdc9",
						data: data,
						value: "0n",
					},
					owner: walletAddress,
					part: hashKey,
					permit: permitSignature,
				},
			},
			config
		);

		if (response.data.error) {
			throw new Error(`Failed to register: ${response.data.error.message}`);
		}

		log.success(`${workerLogInfo} User successfully registered`);
		return "Success";
	} catch (error) {
        if ((error as Error).message.includes("Session could not find")) {
            log.warning(`${workerLogInfo} Session could not find. Creating new session...`);
            await createSession(sessionId, walletAddress, config, workerLogInfo);
            await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
            return await register(sessionId, walletAddress, permitSignature, hashKey, config, workerLogInfo, retries - 1);
        }

		if (retries > 0) {
			log.warning(`${workerLogInfo} Retrying registration... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
			return await register(sessionId, walletAddress, permitSignature, hashKey, config, workerLogInfo, retries - 1);
		} else {
			throw new Error(`${workerLogInfo} Failed to register after multiple attempts: ${(error as Error).message}`);
		}
	}
};
