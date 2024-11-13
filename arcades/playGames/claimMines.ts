import axios from "axios";
import { CONTRACT, log } from "../../utils/config";
import { Config } from "../../utils/config";

export const claimMines = async (walletAddress: string, sessionId: number, permitSignature: string, hashKey: string, config: Config, workerLogInfo: string) => {
	try {
		const response = await axios.post(
			"https://arcade.hub.soniclabs.com/rpc",
			{
				jsonrpc: "2.0",
				id: sessionId,
				method: "call",
				params: {
					call: {
						dest: CONTRACT,
						data: "0x0d942fd00000000000000000000000008bbd8f37a3349d83c85de1f2e32b3fd2fce2468e0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000e328a0b1e0be7043c9141c2073e408d1086e117500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000007656e6447616d65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
						value: "0n",
					},
					owner: walletAddress,
					part: hashKey,
					permit: permitSignature,
				},
			},
			config
		);

		if (response.data?.error?.code === 203) {
			log.info(`${workerLogInfo} You lost the game and no points to claim`);
		} else {
			log.success(`${workerLogInfo} You won the game and claimed points`);
		}
	} catch (error) {
		throw new Error(`${workerLogInfo} Error during claim request: ${(error as Error).message}`);
	}
};