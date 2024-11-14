# Arcades Bot

This bot is designed to automate gameplay in arcade games (Single Wheel, Plinko, Mines). It runs games with necessary tools and parameters. 

## Telegram Channel

If you want to be the first to know about new updates and have access to different scripts, you can join my Telegram channel: [Telegram](https://t.me/svitoch_blockchain)

## Features

- Claiming tokens for playing games.
- Registering, create sessions, signing messages and do all necessary steps to play games.
- Playing each game (Single Wheel, Plinko, Mines) 10 times in random order.
- The most profitable scheme of playing games for earning points is selected
- Selects random cells for mines game and claim points after each game if won.
- Connect users as a referral if they don't have a referral code before.
- Running games in parallel for multiple wallets.

## Requirements

- Git v2.13 or later
- Node.js v16.14.0 or later
- Private keys.
- Twitter auth tokens.
- Proxies. You can get quality proxies [here](https://ca.internetspace.com.ua) (recommended).
- Two-captcha api key. You can get it [here](https://2captcha.com/?from=18461806).

## Installation

1. Clone this repository to your local machine:

    ```bash
    git clone https://github.com/makemakererer/sonic-airdrop.git
    ```

2. Navigate to the project directory:

    ```bash
    cd sonic-farm
    ```

3. Install the required dependencies:

    ```bash
    npm install
    ```

## Configuration

In the `/data` folder, you will find three important files:

1. **`private_keys.txt`**: You need to list your private keys here, **one private key per line**. These private keys will be used for playing games.

    Example of `private_keys.txt`:
    ```
    0x123abc456def789...
    0xabcdef123456789...
    ```

2. **`proxies.txt`**: This file should contain a list of proxies, **one per line**, in the following format:

    ```
    http://username:password@hostname:port
    ```

    Example of `proxies.txt`:
    ```
    http://abc123:xyz789@198.51.100.42:8080
    http://abc123:xyz789@198.51.100.42:8080
    ```

3. **`twitter_auth_tokens.txt`**: This file should contain a list of twitter auth tokens **one per line**. Twitter auth tokens are used to claim tokens that used for playing games.
    
    Example of `twitter_auth_tokens.txt`:
    ```
    ecfe4ddcf973c0b54ce21e9faExampleToken
    ecfe4ddcf973c0b54ce21e9faExampleToken
    ```

4. **`two-captcha api key`**: You need to get your own api key for the two-captcha service. You can get it [here](https://2captcha.com/). After that, create `.env` file in the root of the project with the following content:
    ```
    CAPTCHA_API_KEY = your_api_key
    ```

5. **`Config`**: File `config.ts` in `utils` folder contains all the parameters for the bot such as delay between requests, min and max delay between errors, referral code, provider url, etc..

## Running the Script

After configuring the necessary files, you can run the script as follows:

1. Start the script with command:

    ```bash
    npm run start-bot
    ```

2. If you want to run the script in parallel for multiple wallets (recommended if you have more than 200 accounts), start the script with command:

    ```bash
    npm run start-bot-worker
    ```
    Also you need to specify the number of wallets per worker in the `utils/config.ts` file. Example, if you have 1000 wallets and 10 workers, each worker will run 100 wallets. It means you have to specify `walletsPerWorker` as 100.

## Notes

- The bot is designed to run indefinitely until the user stops it or wallets is over.
- The bot spends about 5 minutes on one account. It includes time for solving captchas, receiving tokens if needed, registering in the game, fetch errors and playing each game 10 times.

## Support Me

If you like this project and want to support me, you can donate me a coffee ^_^:

- ERC20: `0x2B2C6524084214BF0ce5CE7A52Bb330D044B1173`


