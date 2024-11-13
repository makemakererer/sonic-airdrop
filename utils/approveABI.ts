import { Interface } from "ethers";

export const approveABI = new Interface([
	{
		inputs: [
			{ internalType: "address", name: "spender", type: "address" },
			{ internalType: "uint256", name: "amount", type: "uint256" },
		],
		name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	}
]);