
import axios from "axios";
import { getSmartWallet, randomDelay } from "../../utils/helpers";
import { GAMES, log, MAX_DELAY_PLAYING_GAMES, MIN_DELAY_PLAYING_GAMES } from "../../utils/config";
import { claimMines } from "./claimMines";
import { getRandomDataMineIndex } from "../../utils/dataMines";
import { Config } from "../../utils/config";

export const reIterate = async (walletAddress: string, sessionId: number, game: string, config: Config, workerLogInfo: string, retries = 2) => {
	await randomDelay(MIN_DELAY_PLAYING_GAMES, MAX_DELAY_PLAYING_GAMES);
	const smartWalletAddress = await getSmartWallet(walletAddress);

	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				jsonrpc: "2.0",
				id: sessionId,
				method: "reIterate",
				params: {
					game: game,
					player: smartWalletAddress,
				},
			},
			config
		);

		if (response.data.error) {
			throw new Error(response.data.error.message);
		} else {
			log.info(`${workerLogInfo} Get new random number for game...`);
		}
	} catch (error) {
		if (retries > 0) {
			log.warning(`${workerLogInfo} Retrying get random number... Attempts left: ${retries}`);
			await reIterate(walletAddress, sessionId, game, config, workerLogInfo, retries - 1);
		} else {
			throw new Error(`${workerLogInfo} Failed to get random number for game ${game} after multiple attempts: ${(error as Error).message}`);
		}
	}
};

export const startGame = async (
	nameGame: string,
	sessionId: number,
	walletAddress: string,
	iteration: number,
	permitSignature: string,
	hashKey: string,
	config: Config,
	workerLogInfo: string
): Promise<string> => {
	const gameData = GAMES[nameGame as keyof typeof GAMES];
	if (nameGame === "mines") {
		const minesData = getRandomDataMineIndex();
		gameData.data = minesData;
	}

	let errorMessage = "";
	
	await randomDelay(MIN_DELAY_PLAYING_GAMES, MAX_DELAY_PLAYING_GAMES);
	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				jsonrpc: "2.0",
				id: sessionId,
				method: "call",
				params: {
					call: gameData,
					owner: walletAddress,
					part: hashKey,
					permit: permitSignature,
				},
			},
			config
		);

		if (response.data.error) {
			errorMessage = response.data.error.message;
		} else {
			log.success(`${workerLogInfo} Successfully played - ${nameGame} №${iteration}`);

            if (nameGame === "mines") {
                await randomDelay(MIN_DELAY_PLAYING_GAMES, MAX_DELAY_PLAYING_GAMES);
                await claimMines(walletAddress, sessionId, permitSignature, hashKey, config, workerLogInfo);
            }
		}
	} catch (error) {
		if (error instanceof Error) {
			errorMessage = error.message;
		} else {
			errorMessage = String(error);
		}
	}

	if (errorMessage.includes("Locked")) {
		log.error(`${workerLogInfo} Account has been banned, wait for 1.5 - 1.6 hours `);
        return "banned";

		// TODO: Maybe write banned account to file and launch after 1.5 - 1.6 hours again?
		// await randomDelay(1.5 * 3600, 1.6 * 3600); // wait 1.5 - 1.6 hours
		// return await startGame(nameGame, sessionId, walletAddress, iteration, permitSignature, hashKey, proxyAgent);
	}

	if (errorMessage.includes("limit")) {
		log.warning(`${workerLogInfo} Account has been limited for game - ${nameGame}`);
		return "limited";
	}

	if (errorMessage.includes("random number")) {
		return "random number";
	}

	if (errorMessage) {
		throw new Error(errorMessage);
	}

	return "success";
};  