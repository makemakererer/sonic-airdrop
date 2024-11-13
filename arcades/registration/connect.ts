import axios, { AxiosInstance } from "axios";
import { Config, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES, MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, REFERRER_CODE } from "../../utils/config";
import { log } from "../../utils/config";
import { randomDelay } from "../../utils/helpers";
import { Wallet } from "ethers";

export const connectToSonic = async (wallet: Wallet, config: Config, workerLogInfo: string) => {
	let user;

	try {
		const response = await axios.get(
			`https://airdrop.soniclabs.com/api/trpc/user.findOrCreate?batch=1&input=${encodeURIComponent(
				JSON.stringify({ 0: { json: { address: wallet.address } } })
			)}`,
			config
		);

		user = response.data[0].result.data.json;
	} catch (error) {
		throw new Error(`Error fetching user information: ${(error as Error).message}`);
	}

	try {
		if (user.invitedCode === null) {
			const messageToSign = `I'm joining Sonic Airdrop Dashboard with my wallet, have been referred by ${REFERRER_CODE}, and I agree to the terms and conditions.\nWallet address:\n${wallet.address}\n`;
			const signatureMessage = await wallet.signMessage(messageToSign);

            await randomDelay(MIN_DELAY_REQUESTS_REGISTERING_TO_GAMES, MAX_DELAY_REQUESTS_REGISTERING_TO_GAMES);
			const response = await axios.post("https://airdrop.soniclabs.com/api/trpc/user.setInvited?batch=1", {
				0: {
					json: {
						address: wallet.address,
						invitedCode: REFERRER_CODE,
						signature: signatureMessage,
					}
				}
			}, config);

			if (response.data[0].error) {
				throw new Error(response.data[0].error.message);
			}
		}
	} catch (error) {
		log.error(`${workerLogInfo} Error connecting to Sonic as referred user: ${(error as Error).message}`);
	}

	log.success(`${workerLogInfo} Successfully connected to Sonic`);
    return user;
};