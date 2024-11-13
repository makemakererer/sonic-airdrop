import axios from "axios";
import { log, MAX_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES, MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES } from "../../utils/config";
import { randomDelay } from "../../utils/helpers";
import { Wallet } from "ethers";
import { verifyUser } from "../services/verification";
import { createSession } from "./session";
import { Config } from "../../utils/config";

export const permitTypedMessage = async (sessionId: number, wallet: Wallet, config: Config, workerLogInfo: string, retries = 2): Promise<string> => {
	await randomDelay(MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES);

	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				id: sessionId,
				jsonrpc: "2.0",
				method: "permitTypedMessage",
				params: {
					owner: wallet.address,
				},
			},
			config
		);

		if (response.data.error) {
            if (response.data.error.code === 401) {
                log.warning(`${workerLogInfo} Permit typed message failed with 401 error. Need to verify user...`);
                await verifyUser(wallet, config, workerLogInfo);
                await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
                return await permitTypedMessage(sessionId, wallet, config, workerLogInfo, retries - 1  );
            } else {
                throw new Error(`${workerLogInfo} Failed to create permit typed message: ${response.data.error.message}`);
            }
		}

        if (!response.data.result.typedMessage) {
            log.warning(`${workerLogInfo} Permit typed message failed. Retrying...`);
            await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
            return await permitTypedMessage(sessionId, wallet, config, workerLogInfo, retries - 1); 
        }

		const message = JSON.parse(response.data.result.typedMessage);
		await randomDelay(MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES);

		const permitSignature = await wallet.signTypedData(message.json.domain, message.json.types, message.json.message);
		log.success(`${workerLogInfo} Permit signature created and processed`);

		await randomDelay(MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES);
		return permitSignature;
	} catch (error) {
        if ((error as Error).message.includes("Session could not find")) {
            log.warning(`${workerLogInfo} Session could not find. Creating new session...`);
            await createSession(sessionId, wallet.address, config, workerLogInfo);
            await randomDelay(10, 20);
            return await permitTypedMessage(sessionId, wallet, config, workerLogInfo, retries - 1);
        }

		if (retries > 0) {
			log.warning(`${workerLogInfo} Retrying permit typed message... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(10, 20);
			return await permitTypedMessage(sessionId, wallet, config, workerLogInfo, retries - 1);
		} else {
			throw new Error(`${workerLogInfo} Failed to create permit typed message after multiple attempts: ${(error as Error).message}`);
		}
	}
};

export const permit = async (sessionId: number, wallet: Wallet, permitSignature: string, config: Config, workerLogInfo: string, retries = 2): Promise<string> => {
	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				jsonrpc: "2.0",
				id: sessionId,
				method: "permit",
				params: {
					owner: wallet.address,
					signature: permitSignature,
				},
			},
			config
		);

		if (response.data.error) {
            if (response.data.error.code === 401) {
                log.warning(`Permit typed message failed with 401 error. Need to verify user...`);
                await verifyUser(wallet, config, workerLogInfo);
                await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
                return await permitTypedMessage(sessionId, wallet, config, workerLogInfo, retries - 1);
            } else {
                throw new Error(`Failed to create permit typed message: ${response.data.error.message}`);
            }
		}
        if (!response.data.result.hashKey) {
            log.warning(`Permit submission failed. Retrying...`);
            await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
            return await permit(sessionId, wallet, permitSignature, config, workerLogInfo, retries - 1); 
        }

		const hashKey = response.data.result.hashKey;
		log.success(`${workerLogInfo} Permit submitted successfully`);

		await randomDelay(MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES);
		return hashKey;
	} catch (error) {
		if (retries > 0) {
			log.warning(`Retrying permit submission... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
			return await permit(sessionId, wallet, permitSignature, config, workerLogInfo, retries - 1);
		} else {
			throw new Error(`${workerLogInfo} Failed to submit permit after multiple attempts: ${(error as Error).message}`);
		}
	}
};