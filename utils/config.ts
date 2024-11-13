import { ethers, Interface } from "ethers";
import chalk from "chalk";
import { HttpsProxyAgent } from "https-proxy-agent";

//! delays in seconds
export const MIN_DELAY_REQUESTS_RECEIVING_TOKENS = 2;
export const MAX_DELAY_REQUESTS_RECEIVING_TOKENS = 4;
export const MIN_DELAY_ERROR_RECEIVING_TOKENS = 3;
export const MAX_DELAY_ERROR_RECEIVING_TOKENS = 5;

// create session, sign message, register to games, etc...
export const MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES = 1;
export const MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES = 3;
export const MIN_DELAY_ERROR_REGISTERING_TO_GAMES = 3;
export const MAX_DELAY_ERROR_REGISTERING_TO_GAMES = 5;

export const MIN_DELAY_PLAYING_GAMES = 3;
export const MAX_DELAY_PLAYING_GAMES = 5;
export const MIN_DELAY_ERROR_PLAYING_GAMES = 5;
export const MAX_DELAY_ERROR_PLAYING_GAMES = 7;

export const PROVIDER = new ethers.JsonRpcProvider("https://rpc.testnet.soniclabs.com");
export const REFERRER_CODE = "209fx5";
export const WALLETS_PER_WORKER = 1;

export const CONTRACT = "0xA7C492D9B3BD057845e3bC080c250ad868518478";
export const GAMES = {
	plinko: {
		dest: CONTRACT,
        data: "0x0d942fd00000000000000000000000001cc5bc5c6d5fbb637164c8924528fb2d611fa5090000000000000000000000000000000000000000000000000000000000000002000000000000000000000000e328a0b1e0be7043c9141c2073e408d1086e117500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000003626574000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a",
		value: "0n",
	},
	singlewheel: {
		dest: CONTRACT,
		data: "0x0d942fd000000000000000000000000070e7c3846ac8c4308f7eeb0e6a3ceedc325539a60000000000000000000000000000000000000000000000000000000000000002000000000000000000000000e328a0b1e0be7043c9141c2073e408d1086e117500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000003626574000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001",
		value: "0n",
	},
	mines: {
		dest: CONTRACT,
		data: "0x0d942fd00000000000000000000000008bbd8f37a3349d83c85de1f2e32b3fd2fce2468e0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000e328a0b1e0be7043c9141c2073e408d1086e117500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000003626574000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003800000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
		value: "0n",
	},
};

export const HEADERS = {
	'Accept-Language': 'en-GB,en;q=0.9',
	'Sec-Fetch-Dest': 'empty',
	'Sec-Fetch-Site': 'cross-site',
	'Sec-Fetch-Mode': 'cors',
	'Origin': 'https://arcade.soniclabs.com',
	'Pragma': 'no-cache',
	'Referer': 'https://arcade.soniclabs.com'
};

export interface Config {
	headers: Record<string, string>;
	httpsAgent: HttpsProxyAgent<string>;
}

export const log = {
	start: (walletAddress: string) => console.log(chalk.white(`------------------------------ START WITH ${walletAddress} ------------------------------`)),
	success: (msg: string) => console.log(chalk.green("✅" + msg)),
	error: (msg: string) => console.log(chalk.red("❌" + msg)),
	info: (msg: string) => console.log(chalk.blue("✍️ " + msg)),
	warning: (msg: string) => console.log(chalk.yellow("⚠️ " + msg)),
};






