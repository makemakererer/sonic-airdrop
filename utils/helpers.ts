import axios, { AxiosInstance } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import fs from "fs";
import { ethers } from "ethers";
import crypto from "crypto";
import { Config, log, PROVIDER } from "./config";

export const createApiClient = (baseURL: string, proxy: string): AxiosInstance => {
	const proxyAgent = new HttpsProxyAgent(proxy);
	return axios.create({
		baseURL,
		httpsAgent: proxyAgent,
	});
};

export const loadFileLines = (filePath: string): string[] => {
	return fs
		.readFileSync(filePath, "utf-8")
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line);
};

export const randomDelay = (minSeconds = 1, maxSeconds = 5) => {
	const minMs = minSeconds * 1000;
	const maxMs = maxSeconds * 1000;

	const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

	return new Promise((resolve) => setTimeout(resolve, delay));
};

export const getSmartWallet = async (walletAddress: string) => {
	const contractAddress = "0x5a174Dd1272Ea03A41b24209ed2A3e9ee68f9148";

	const functionSelector = "0x5fbfb9cf";
	const abiCoder = new ethers.AbiCoder();
	const encodedAddress = abiCoder.encode(["address"], [walletAddress]).slice(2); // remove "0x"
	const additionalPadding = "0".repeat(64); // 32 bytes of padding (64 hex characters)
	const data = `${functionSelector}${encodedAddress}${additionalPadding}`;

	try {
		const result = await PROVIDER.call({
			to: contractAddress,
			data: data,
		});

		const decodedAddress = ethers.AbiCoder.defaultAbiCoder().decode(["address"], result)[0];

		return decodedAddress;
	} catch (error) {
		log.error(`Error getting smart wallet: ${(error as Error).message}`);
	}
};

export const getPoints = async (walletAddress: string, config: Config) => {
	const smartAddress = await getSmartWallet(walletAddress);

	try {
		const response = await axios.get(`https://arcade.gateway.soniclabs.com/game/points-by-player`, {
			params: { wallet: smartAddress },
			...config
		});

		log.info(`Earned points today - ${Number(response.data.today).toFixed(2)}`);
		log.info(`Total earned points - ${Number(response.data.totalPoints).toFixed(2)}`);
	} catch (error) {
		log.error(`Failed to get points: ${(error as Error).message}`);
	}
};

export const checkTokenBalance = async (walletAddress: string) => {
    const balanceOfABI = ["function balanceOf(address owner) view returns (uint256)"];
	const tokenContractAddress = "0x4Cc7b0ddCD0597496E57C5325cf4c73dBA30cdc9";

	const tokenContract = new ethers.Contract(tokenContractAddress, balanceOfABI, PROVIDER);
	const smartWalletAddress = await getSmartWallet(walletAddress);

	try {
		const balance = await tokenContract.balanceOf(smartWalletAddress);
		const humanBalance = Number(ethers.formatEther(balance));
		return humanBalance;
	} catch (error) {
		log.error(`Error checking token balance: ${(error as Error).message}`);
	}
}

export const truncateAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-7)}`;
};

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

export function generateRandomUserAgent(): string {
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Opera', 'Edge']
    const os = ['Windows NT 10.0', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64', 'iPhone; CPU iPhone OS 14_0 like Mac OS X', 'Android 10']

    const browser = getRandomElement(browsers)
    const operatingSystem = getRandomElement(os)

    let userAgent = ''

    switch (browser) {
        case 'Chrome':
            userAgent = `Mozilla/5.0 (${operatingSystem}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${Math.floor(Math.random() * 100)}.0.${Math.floor(Math.random() * 10000)}.0 Safari/537.36`
            break
        case 'Firefox':
            userAgent = `Mozilla/5.0 (${operatingSystem}; rv:${Math.floor(Math.random() * 100)}.0) Gecko/20100101 Firefox/${Math.floor(Math.random() * 100)}.0`
            break
        case 'Safari':
            userAgent = `Mozilla/5.0 (${operatingSystem}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${Math.floor(Math.random() * 15)}.0 Safari/605.1.15`
            break
        case 'Opera':
            userAgent = `Mozilla/5.0 (${operatingSystem}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${Math.floor(Math.random() * 100)}.0.${Math.floor(Math.random() * 10000)}.0 Safari/537.36 OPR/${Math.floor(Math.random() * 100)}.0.0.0`
            break
        case 'Edge':
            userAgent = `Mozilla/5.0 (${operatingSystem}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${Math.floor(Math.random() * 100)}.0.${Math.floor(Math.random() * 10000)}.0 Safari/537.36 Edg/${Math.floor(Math.random() * 100)}.0.0.0`
            break
    }

    return userAgent
}

export const generateCSRF = (nbytes = 16) => {
	return crypto.getRandomValues(new Uint8Array(nbytes)).reduce((a: any, b: any) => a + b.toString(16).padStart(2, "0"), "");
};
