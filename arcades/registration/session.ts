import axios from "axios";
import { randomDelay } from "../../utils/helpers";
import { log, MAX_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES, MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES } from "../../utils/config";
import { Config } from "../../utils/config";

export const createSession = async (sessionId: number, walletAddress: string, config: Config, workerLogInfo: string, retries = 2) => {
	await randomDelay(MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES);

	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				jsonrpc: "2.0",
				id: sessionId,
				method: "createSession",
				params: {
					owner: walletAddress,
					until: Date.now() + 86400000, // 24 hours in milliseconds
				},
			},
			config
		);

		if (response.data.error) {
			throw new Error(response.data.error.message);
		}

		log.success(`${workerLogInfo} Session created successfully`);
		return "Success";
	} catch (error) {
		if ((error as Error).message.includes("423")) {
			throw new Error("User banned with 423 error");
		}

		if (retries > 0) {
			log.warning(`${workerLogInfo} Retrying session creation... Attempts left: ${retries}. Error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
			await createSession(sessionId, walletAddress, config, workerLogInfo, retries - 1);
		} else {
			throw new Error(`Failed to create session after multiple attempts: ${error}`);
		}
	}
};