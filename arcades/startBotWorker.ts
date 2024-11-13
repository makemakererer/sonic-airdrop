import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpus } from 'os';
import { runGames } from './playGames/runGames';
import { log, WALLETS_PER_WORKER } from '../utils/config';
import { Wallet } from 'ethers';
import { loadFileLines } from '../utils/helpers';

const privateKeys = loadFileLines("data/private_keys.txt");
const proxies = loadFileLines("data/proxies.txt");
const twitterAuthTokens = loadFileLines("data/twitter_auth_tokens.txt");

if (isMainThread) {
    const startPlayGames = async () => {
        log.info(`Starting to play games...`);
        if (privateKeys.length !== proxies.length || privateKeys.length !== twitterAuthTokens.length) {
            log.error("Private keys, proxies and twitter auth tokens must have the same amount of lines");
            return;
        }

        const totalWallets = privateKeys.length;
        const numWorkers = Math.ceil(totalWallets / WALLETS_PER_WORKER);
        const workers: Promise<void>[] = [];

        for (let i = 0; i < numWorkers; i++) {
            const startIdx = i * WALLETS_PER_WORKER;
            const endIdx = Math.min(startIdx + WALLETS_PER_WORKER, totalWallets);
            
            const workerData = {
                privateKeys: privateKeys.slice(startIdx, endIdx),
                proxies: proxies.slice(startIdx, endIdx),
                twitterAuthTokens: twitterAuthTokens.slice(startIdx, endIdx),
                workerNumber: i + 1,
            };

            workers.push(
                new Promise((resolve, reject) => {
                    const worker = new Worker(__filename, { workerData });
                    
                    worker.on('message', (message) => {
                        log.info(`Worker ${workerData.workerNumber}: ${message}`);
                    });
                    
                    worker.on('error', reject);
                    worker.on('exit', (code) => {
                        if (code !== 0) {
                            reject(new Error(`Worker ${workerData.workerNumber} stopped with exit code ${code}`));
                        } else {
                            resolve();
                        }
                    });
                })
            );
        }

        try {
            await Promise.allSettled(workers);
            log.info(`Finished playing games on all workers!`);
        } catch (error) {
            log.error(`Error in worker: ${(error as Error).message}`);
        }
    };

    startPlayGames();
} else {
    const runWorker = async () => {
        const { privateKeys, proxies, twitterAuthTokens, workerNumber } = workerData;

        for (let i = 0; i < privateKeys.length; i++) {
            const wallet = new Wallet(privateKeys[i]);

            try {
                parentPort?.postMessage(`Starting games for wallet ${wallet.address}`);
                await runGames(wallet, proxies[i], twitterAuthTokens[i], true, workerNumber);
                parentPort?.postMessage(`Finished games for wallet ${wallet.address}`);
            } catch (error) {
                parentPort?.postMessage(`Error playing games with proxy ${proxies[i]} and wallet ${wallet.address}: ${(error as Error).message}`);
            }
        }
    };

    runWorker().catch((error) => {
        parentPort?.postMessage(`Worker error: ${error.message}`);
        process.exit(1);
    });
}