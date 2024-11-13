import { Solver } from "@2captcha/captcha-solver";
import dotenv from "dotenv";
import { log } from "../../utils/config";

dotenv.config();
const captchaApiKey = process.env.CAPTCHA_API_KEY || "";
const solver = new Solver(captchaApiKey);

export const resolveTurnstile = async (proxyString: string, sitekey = "0x4AAAAAAAyydII5jG2Ee-84", retries = 2): Promise<string> => {
	const url = new URL(proxyString);
	const proxyType = url.protocol.replace(":", "");
	const proxy = `${url.username}:${url.password}@${url.hostname}:${url.port}`;

	let captcha;
	try {
		captcha = await solver.cloudflareTurnstile({
			pageurl: "https://arcade.soniclabs.com/",
			sitekey,
			proxytype: proxyType,
			proxy,
		});
	} catch (error) {
		if (retries > 0) {
			log.warning(`Error resolving turnstile: ${(error as Error).message}`);
			return resolveTurnstile(proxyString, sitekey, retries - 1);
		} else {
			throw Error(`Error resolving turnstile: ${(error as Error).message}`);
		}
	}

	return captcha?.data.toString();
};

export const resolveRecaptcha = async (proxyString: string, retries = 2): Promise<string> => {
	const url = new URL(proxyString);
	const proxyType = url.protocol.replace(":", "");
	const proxy = `${url.username}:${url.password}@${url.hostname}:${url.port}`;

	let captcha;
	try {
		captcha = await solver.recaptcha({
			pageurl: "https://arcade.soniclabs.com/",
			googlekey: "6LcyTm4qAAAAAFq36Fd4WV4P49bYApsy2Rw8Xw73",
			proxytype: proxyType,
			proxy,
		});
	} catch (error) {
		if (retries > 0) {
			log.warning(`Error resolving recaptcha: ${(error as Error).message}`);
			return resolveRecaptcha(proxyString, retries - 1);
		} else {
			throw Error(`Error resolving recaptcha: ${(error as Error).message}`);
		}
	}

	return captcha?.data.toString();
};
