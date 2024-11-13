import { checkTokenBalance, generateRandomUserAgent, getPoints, loadFileLines, randomDelay, truncateAddress } from "../../utils/helpers";
import { Wallet } from "ethers";
import { HEADERS, log, MAX_DELAY_ERROR_REGISTERING_TO_GAMES, MIN_DELAY_ERROR_REGISTERING_TO_GAMES } from "../../utils/config";
import { register } from "../registration/register";
import { connectToSonic } from "../registration/connect";
import { createSession } from "../registration/session";
import { permit, permitTypedMessage } from "../registration/permit";
import { reIterate, startGame } from "./playGame";
import { HttpsProxyAgent } from "https-proxy-agent";
import { receiveTokensForWallet } from "../services/getTokens";

export const runGames = async (wallet: Wallet, proxy: string, twitterAuthToken: string, isWorker: boolean = false, workerNumber: number = 0, retries: number = 1): Promise<void> => {
	const startTime = Date.now();
	const proxyAgent = new HttpsProxyAgent(proxy);

	let workerLogInfo = '';
	if (isWorker){
		let walletAddress = truncateAddress(wallet.address);
		workerLogInfo = `Worker ${workerNumber} - ${walletAddress} message: `;
	} 
	const config = {
		headers: {
			...HEADERS,
			network: "SONIC", 
			"x-owner": wallet.address,
			'User-Agent': generateRandomUserAgent(),
		},
		httpsAgent: proxyAgent,
	};

	let sessionId = 1;
	let permitSignature: string | undefined = undefined;
	let hashKey: string | undefined = undefined;

	let balance = await checkTokenBalance(wallet.address);
	if (balance! < 100) {
		try {
			await receiveTokensForWallet(wallet.address, twitterAuthToken, proxy, workerLogInfo);
		} catch (error) {
			log.error(`${workerLogInfo} Failed to receive tokens: ${(error as Error).message}`);
		}
	}

	balance = await checkTokenBalance(wallet.address);
	if (balance === 0) {
		throw new Error("No tokens on the wallet");
	}

	try {
		const user = await connectToSonic(wallet, config, workerLogInfo);
		if (!user) throw new Error("Failed to connect to Sonic");

		const createSessionResult = await createSession(sessionId, wallet.address, config, workerLogInfo);
		if (createSessionResult === "Success") {
			sessionId++;
		} else {
			throw new Error("Failed to create session");
		}

		permitSignature = await permitTypedMessage(sessionId, wallet, config, workerLogInfo);
		if (permitSignature) {
			sessionId++;
		} else {
			throw new Error("Failed to get permit signature");
		}

		hashKey = await permit(sessionId, wallet, permitSignature, config, workerLogInfo);
		if (hashKey) {
			sessionId++;
		} else {
			throw new Error("Failed to get hash key");
		}

		const registerResult = await register(sessionId, wallet.address, permitSignature, hashKey, config, workerLogInfo);
		if (registerResult === "Success") {
			sessionId++;
		} else {
			throw new Error("Failed to register");
		}
	} catch (error) {
		if (retries > 0) {
			log.warning(`${workerLogInfo} Retrying connecting to Sonic... Attempts left: ${retries}. Error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
			return await runGames(wallet, proxy, twitterAuthToken, isWorker, workerNumber, retries - 1);
		} else {
			throw new Error(`Failed to connect to Sonic after multiple attempts: ${(error as Error).message}`);
		}	
	}

	const games = ["singlewheel", "plinko", "mines"];
	const shuffledGames = games.sort(() => Math.random() - 0.5);
	
	for (const game of shuffledGames) {
		log.info(`${workerLogInfo} Playing ${game}...`);
		for (let i = 0; i < 10; i++) {
			try {
				const result = await startGame(game, sessionId, wallet.address, i + 1, permitSignature!, hashKey!, config, workerLogInfo);
				if (result === "random number") {
					await reIterate(wallet.address, sessionId, game, config, workerLogInfo);
					sessionId++;
				} else if (result === "banned") {
					return;
				}
	
				if (result === "limited") break;
				result === "success" && sessionId++;
			} catch (error) {
				log.error(`${workerLogInfo} Error in ${game} № ${i + 1}: ${(error as Error).message}`);
				if ((error as Error).message.includes("423") || (error as Error).message.includes("refresh")) {
					return;
				}
			}
		}
	}

	await getPoints(wallet.address, config);
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    log.info(`${workerLogInfo} Execution time: ${minutes}m ${seconds}s`);
};