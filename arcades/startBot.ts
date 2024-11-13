import { loadFileLines } from "../utils/helpers";
import { Wallet } from "ethers";
import { log } from "../utils/config";
import { runGames } from "./playGames/runGames";

const proxies = loadFileLines("data/proxies.txt");
const privateKeys = loadFileLines("data/private_keys.txt");
const twitterAuthTokens = loadFileLines("data/twitter_auth_tokens.txt");

const startPlayGames = async () => {
	log.info(`Starting to play games...`);
	if (privateKeys.length !== proxies.length || privateKeys.length !== twitterAuthTokens.length) {
		log.error("Private keys, proxies and twitter auth tokens must have the same amount of lines");
		return;
	}

	for (let i = 0; i < proxies.length; i++) {
		const wallet = new Wallet(privateKeys[i]);

		try {
			log.start(wallet.address);
			log.info(`Playing games... ${i + 1} of ${proxies.length}`);
			
			await runGames(wallet, proxies[i], twitterAuthTokens[i]);
		} catch (error) {
			log.error(`Error playing games with proxy ${proxies[i]} and wallet ${wallet.address}: ${(error as Error).message}`);
		}
	}

	log.info(`Finished playing games!`);
}

startPlayGames();
