export interface RequestArguments {
	readonly method: string;
	readonly params: any[];
}

export interface AddEthereumChainParameter {
	chainId: string; // A 0x-prefixed hexadecimal string
	chainName: string;
	nativeCurrency: {
		name: string;
		symbol: string; // 2-6 characters long
		decimals: 18;
	};
	rpcUrls: string[];
	blockExplorerUrls?: string[];
	iconUrls?: string[]; // Currently ignored.
}

export interface SwitchEthereumChainParameter {
	chainId: string; // A 0x-prefixed hexadecimal string
}
