import axios, { AxiosInstance } from "axios";
import { createApiClient, generateCSRF, getSmartWallet, loadFileLines, randomDelay } from "../../utils/helpers";
import { ethers } from "ethers";
import { log, MIN_DELAY_REQUESTS_RECEIVING_TOKENS, MAX_DELAY_REQUESTS_RECEIVING_TOKENS, MIN_DELAY_ERROR_RECEIVING_TOKENS, MAX_DELAY_ERROR_RECEIVING_TOKENS } from "../../utils/config";
import { resolveTurnstile } from "./captcha";

const proxies = loadFileLines("data/proxies.txt");
const privateKeys = loadFileLines("data/private_keys.txt");
const twitterAuthTokens = loadFileLines("data/twitter_auth_tokens.txt");

export const receiveTokensForWallet = async (walletAddress: string, twitterAuthToken: string, proxy: string, workerLogInfo: string, retries = 3): Promise<string> => {
	log.info(`${workerLogInfo} Receiving tokens for user...`);

	const smartWalletAddress = await getSmartWallet(walletAddress);
	const apiClient = createApiClient("https://arcade.soniclabs.com", proxy);
	const cookiesResponse = await getCookies(apiClient);
	const { cookies, codeChallenge, state } = cookiesResponse!;

	await randomDelay(MIN_DELAY_REQUESTS_RECEIVING_TOKENS, MAX_DELAY_REQUESTS_RECEIVING_TOKENS);
	const authUrl = await authTwitter(codeChallenge!, state!, proxy, twitterAuthToken);
	const sessionToken = await getSessionToken(authUrl!, cookies!, apiClient);
	await randomDelay(MIN_DELAY_REQUESTS_RECEIVING_TOKENS, MAX_DELAY_REQUESTS_RECEIVING_TOKENS);
	try {
		const captcha = await resolveTurnstile(proxy, "0x4AAAAAAAvmBjpo127nc2Kh");
		const response = await apiClient.post("/", [smartWalletAddress, captcha], {
			headers: {
				Cookie: sessionToken,
				"Next-Action": "723f0fb7d0e2429f63714f8545412d0219c2d397",
			},
		});

		const message = response.data.match(/"message":"([^"]+)"/)[1];
		if (message !== "Transaction confirmed.") {
			throw new Error(message);
		}

		log.success(`${workerLogInfo} Received tokens for user: ${message}`);
		return message;
	} catch (error) {	
		if (retries > 0) {
			log.warning(`Retrying captcha resolution... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_RECEIVING_TOKENS, MAX_DELAY_ERROR_RECEIVING_TOKENS);
			return await receiveTokensForWallet(walletAddress, twitterAuthToken, proxy, workerLogInfo, retries - 1);
		} else {
			throw new Error(`Failed to receive tokens after multiple attempts: ${(error as Error).message}`);
		}
	}
};

const getCookies = async (apiClient: AxiosInstance, retries = 2) => {
	try {
		const response = await apiClient.post("/", {}, 
			{
				headers: {
					"Next-Action": "c7a4b8e3e6267f4bd093cca5f9fcea7af271bf3c",
				},
				withCredentials: true,
				maxRedirects: 0,
				validateStatus: (status) => status === 303,
			}
		);
		const unnessaryCookie = "__Secure-authjs.callback-url=https%3A%2F%2Farcade.soniclabs.com; Path=/; HttpOnly; Secure; SameSite=Lax";
		const cookies = response.headers["set-cookie"]?.
			filter((cookie) => cookie !== unnessaryCookie)
			.map((cookie) => cookie.split(";")[0])
			.join("; ");

		const url = new URL(response.headers["x-action-redirect"]);
		const codeChallenge = url.searchParams.get("code_challenge");
		const state = url.searchParams.get("state");

		return { cookies, codeChallenge, state };
	} catch (error) {
		if (retries > 0) {
			log.warning(`Retrying get cookies... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_RECEIVING_TOKENS, MAX_DELAY_ERROR_RECEIVING_TOKENS);
			return await getCookies(apiClient, retries - 1);
		} else {
			throw new Error(`Failed to get cookies after multiple attempts: ${(error as Error).message}`);
		}
	}
};

const authTwitter = async (codeChallenge: string, state: string, proxy: string, twitterAuthToken: string, retries = 2) => {
	const bearerToken = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
	const clientId = "ZWxXa0JjYjVjT0VWTXBYemhZdFE6MTpjaQ";
	const apiClient = createApiClient("https://x.com", proxy);
	const csrftoken = generateCSRF();

	let authCode = "";

	try {
		const response = await apiClient.get("/i/api/2/oauth2/authorize", {
			params: {
				client_id: clientId,
				code_challenge: codeChallenge,
				code_challenge_method: "S256",
				redirect_uri: "https://arcade.soniclabs.com/api/auth/callback/twitter",
				response_type: "code",
				scope: "users.read tweet.read offline.access",
				state: state,
			},
			headers: {
				Authorization: `Bearer ${bearerToken}`,
				Cookie: `ct0=${csrftoken}; auth_token=${twitterAuthToken}`,
				"X-Csrf-Token": csrftoken,
			},
		});

		authCode = response.data.auth_code;
	} catch (error) {
		if (retries > 0) {
			log.warning(`Retrying twitter authorization... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_RECEIVING_TOKENS, MAX_DELAY_ERROR_RECEIVING_TOKENS);
			return await authTwitter(codeChallenge, state, proxy, twitterAuthToken, retries - 1);
		} else {
			throw new Error(`Failed to authorize twitter after multiple attempts: ${(error as Error).message}`);
		}
	}

	try {
		const response = await apiClient.post("/i/api/2/oauth2/authorize", {
				approval: "true",
				code: authCode,
			},
			{
				headers: {
					Authorization: `Bearer ${bearerToken}`,
					Cookie: `ct0=${csrftoken}; auth_token=${twitterAuthToken}`,
					"X-Csrf-Token": csrftoken,
				},
				withCredentials: true,
			}
		);

		return response.data.redirect_uri;
	} catch (error) {
		if (retries > 0) {
			log.warning(`Retrying twitter authorization... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_RECEIVING_TOKENS, MAX_DELAY_ERROR_RECEIVING_TOKENS);
			return await authTwitter(codeChallenge, state, proxy, twitterAuthToken, retries - 1);
		} else {
			throw new Error(`Failed to authorize twitter after multiple attempts: ${(error as Error).message}`);
		}
	}
};

const getSessionToken = async (twitterAuthUrl: string, cookies: string, apiClient: AxiosInstance, retries = 2) => {
	const paramsTwitter = twitterAuthUrl.replace("https://arcade.soniclabs.com", '');

	try {
		const response = await apiClient.get(paramsTwitter, {
			headers: {
				Cookie: cookies,
			},
			withCredentials: true,
			maxRedirects: 0,
			validateStatus: (status) => status === 302,
		});

		const sessionToken = response.headers["set-cookie"]?.find((cookie) => cookie.startsWith("__Secure-authjs.session-token="));
		return sessionToken;
	} catch (error) {
		if (retries > 0) {
			log.warning(`Retrying get session token... Attempts left: ${retries}. Now error: ${(error as Error).message}`);
			await randomDelay(MIN_DELAY_ERROR_RECEIVING_TOKENS, MAX_DELAY_ERROR_RECEIVING_TOKENS);
			return await getSessionToken(twitterAuthUrl, cookies, apiClient, retries - 1);
		} else {
			throw new Error(`Failed to get session token after multiple attempts: ${(error as Error).message}`);
		}
	}
};

const processReceiveTokens = async (workerLogInfo: string = "") => {
	log.info(`${workerLogInfo} Starting the token receiving process...`);

	if (privateKeys.length !== proxies.length || privateKeys.length !== twitterAuthTokens.length) {
        log.error(`${workerLogInfo} Error: not enough private keys, proxies or twitter auth tokens. It should be the same amount.`);
        return;
    }

	for (let i = 0; i < proxies.length; i++) {
		const proxy = proxies[i];
		const privateKey = privateKeys[i];
		const twitterAuthToken = twitterAuthTokens[i];
		const wallet = new ethers.Wallet(privateKey);

		try {
			const message = await receiveTokensForWallet(wallet.address, twitterAuthToken, proxy, workerLogInfo);
		} catch (error) {
			log.error(`${workerLogInfo} Error receiving tokens for wallet ${wallet.address} with proxy ${proxy}: ${(error as Error).message}`);
		}
	}

	log.info(`${workerLogInfo} Token receiving process completed!`);
}

// processReceiveTokens();
// receiveTokensForWallet("0x2ADeB86f25679921B69248e78bf2fcdAEf42e8EC");
