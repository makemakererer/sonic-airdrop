import axios from "axios";
import { resolveRecaptcha } from "./captcha";
import { resolveTurnstile } from "./captcha";
import { Wallet } from "ethers";
import { randomDelay } from "../../utils/helpers";
import { log, MAX_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES, MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES } from "../../utils/config";
import { Config } from "../../utils/config";

export const verifyUser = async (wallet: Wallet, config: Config, workerLogInfo: string, retries = 2) => {
	const cloudflare = await resolveTurnstile(new URL(config.httpsAgent.proxy).href);
	const recaptcha = await resolveRecaptcha(new URL(config.httpsAgent.proxy).href);
	let nonce;

	log.info(`${workerLogInfo} Verifying user with wallet...`);
	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				jsonrpc: "2.0",
				method: "createNonce",
				params: {
					owner: wallet.address,
				},
				id: 1,
			},
			config
		);

		nonce = response.data.result.nonce;
	} catch (error) {
		if (retries > 0) {
			log.warning(`Retrying nonce request... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
			await verifyUser(wallet, config, workerLogInfo, retries - 1);
		} else {
			throw new Error(`Failed to get nonce after multiple attempts: ${error}`);
		}
	}

	const signatureMessage = await wallet.signMessage(nonce);
	await randomDelay(MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES);
	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				jsonrpc: "2.0",
				method: "accept",
				params: {
					cloudflareRecaptchaToken: cloudflare,
					googleRecaptchaToken: recaptcha,
					owner: wallet.address,
					signature: signatureMessage,
				},
				id: 2,
			},
			config
		);

		if (response.data.error) {
			throw new Error(response.data.error.message);
		}

		log.success(`User verified successfully`);
	} catch (error) {
		if (retries > 0) {
			log.warning(`Retrying verification request... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_REGISTERING_TO_GAMES, MAX_DELAY_ERROR_REGISTERING_TO_GAMES);
			await verifyUser(wallet, config, workerLogInfo, retries - 1);
		} else {
			throw new Error(`Failed to verify user after multiple attempts: ${error}`);
		}
	}
};
