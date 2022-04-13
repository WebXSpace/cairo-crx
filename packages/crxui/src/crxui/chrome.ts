import {
	RouteComponent,
	RouteLocationNormalizedLoaded,
	Router,
	useRoute,
	useRouter,
} from 'vue-router';

interface RequestArguments {
	readonly method: string;
	readonly params?: any[];
}

export interface AddEthereumChainParameter {
	chainId: string; // A 0x-prefixed hexadecimal string
	chainName?: string;
	chain?: string;
	nativeCurrency: {
		name: string;
		symbol: string; // 2-6 characters long
		decimals: number;
	};
	rpcUrls?: string[];
	rpc?: string[];
	blockExplorerUrls?: string[];
	explorers?: { name: string; url: string; standar: string }[];
	iconUrls?: string[]; // Currently ignored.
}

/**
 * @ Wallet proxy service
 */
export class WalletProxy {
	private _eid: string;
	private _port: chrome.runtime.Port;

	private _events = new Map<string, Set<any>>();

	constructor() {
		const params = new URLSearchParams(location.hash.split('?')[1]);

		if (!params.has('eid')) {
			throw new Error('expect eid');
		}

		this._eid = params.get('eid')!;
		this._port = chrome.runtime.connect(this._eid);

		this._port.onMessage.addListener(request => {
			const listeners = this._events.get(request.method);

			if (listeners) {
				listeners.forEach(listener => {
					listener(request.params[0]);
				});
			}
		});

		this._port.onDisconnect.addListener(() => {
			window.close();
		});
	}

	on(event: string, listener: any) {
		let listeners = this._events.get(event);

		if (!listeners) {
			listeners = new Set();
			this._events.set(event, listeners);
		}

		listeners.add(listener);

		console.log('add listener', event, this._events);
	}

	removeListener(event: string, listener: any) {
		const listeners = this._events.get(event);

		listeners?.delete(listener);
	}

	async apiKeys(): Promise<any> {
		return await this.request({ method: 'wp_api_keys' });
	}

	async setAPIKey(name: string, value: string) {
		await this.request({ method: 'wp_set_api_key', params: [name, value] });
	}

	async deleteAPIKey(name: string) {
		await this.request({ method: 'wp_delete_api_key', params: [name] });
	}

	async currentChain(origin: string): Promise<AddEthereumChainParameter | undefined> {
		return await this.request({ method: 'wp_current_chain', params: [origin] });
	}

	async clearChains() {
		await this.request({ method: 'wp_clear_chains' });
	}

	async deleteChain(id: String) {
		await this.request({ method: 'wp_delete_chain', params: [id] });
	}

	async chains(): Promise<AddEthereumChainParameter[]> {
		return await this.request({ method: 'wp_chains' });
	}

	async bridgeURL(): Promise<string> {
		return await this.request({ method: 'wp_bridge_url' });
	}

	async setBridgeURL(url: string) {
		return await this.request({ method: 'wp_bridge_set_url', params: [url] });
	}

	async refresh(): Promise<string> {
		return await this.request({ method: 'wp_refreshWalletConnect' });
	}

	async addChain(origin: string, args: AddEthereumChainParameter) {
		return await this.request({ method: 'wp_addEthereumChain', params: [origin, args] });
	}

	async accounts(): Promise<string[] | undefined> {
		return await this.request({ method: 'eth_requestAccounts' });
	}

	async request(args: RequestArguments): Promise<any> {
		return new Promise((accpet, reject) => {
			chrome.runtime.sendMessage(this._eid, args, resp => {
				if (!resp) {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						accpet(undefined);
					}
				} else if (resp.error) {
					reject(resp.error);
				} else {
					accpet(resp.result);
				}
			});
		});
	}
}

const _walletProxy = new WalletProxy();

export function useWalletProxy(): WalletProxy {
	return _walletProxy;
}

export function gobackOrClose(router: Router) {
	if (router.currentRoute.value.query.goback) {
		router.back();
	}

	window.close();
}
