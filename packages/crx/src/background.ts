/// <reference types="chrome"/>

import WalletConnect from '@walletconnect/client';
import { IWalletConnectSession } from '@walletconnect/types';
import { RequestArguments, AddEthereumChainParameter, SwitchEthereumChainParameter } from './types';
import { ethers, providers } from 'ethers';
import _, { chain } from 'lodash';

const defaultBridgeURL = 'https://bridge.walletconnect.org';

const defaultInfuraKey = '9aa3d95b3bc440fa88ea12eaa4456161';

const defaultChain: AddEthereumChainParameter = {
	chainId: '0x1',
	blockExplorerUrls: ['https://ethereum.org'],
	chainName: 'Ethereum Mainnet',
	nativeCurrency: {
		name: 'Ether',
		symbol: 'ETH',
		decimals: 18,
	},
	rpcUrls: [
		'https://mainnet.infura.io/v3/${INFURA_API_KEY}',
		'wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}',
		'https://api.mycryptoapi.com/eth',
		'https://cloudflare-eth.com',
	],
};

interface WindowRef {
	value?: chrome.windows.Window;
}

type WindowType = 'qrCode' | 'switchChain' | 'addChain' | 'options';

interface WebSiteContext {
	hostname: string;
	chain?: AddEthereumChainParameter;
	index: number;
	apiKeyName?: string;
	provider?: providers.JsonRpcProvider;
}

class WalletProvider {
	private _walletConnect!: WalletConnect;

	private _windows = new Map<WindowType, WindowRef>();

	private _ports = new Set<chrome.runtime.Port>();

	private _contexts = new Map<string, WebSiteContext>();

	constructor() {
		chrome.runtime.onMessage.addListener((request, sender, resp) => {
			return this._handle(request, sender, resp);
		});

		chrome.runtime.onMessageExternal.addListener((request, sender, resp) => {
			return this._handle(request, sender, resp);
		});

		/// keep alive
		chrome.runtime.onConnectExternal.addListener(port => {
			this._addPort(port);
		});

		chrome.runtime.onConnect.addListener(port => {
			this._addPort(port);
		});

		chrome.action.onClicked.addListener(async tab => {
			const url = `${this._popupBaseURL}/?eid=${chrome.runtime.id}&origin=${
				new URL(tab.url!).hostname
			}`;

			await this._popupWindow('options', url);
		});
	}

	private _window(type: WindowType): WindowRef {
		let to = this._windows.get(type);

		if (!to) {
			to = {};
			this._windows.set(type, to);
		}

		return to;
	}

	private async _popupWindow(type: WindowType, url: string) {
		const to = this._window(type);

		if (to.value) {
			await chrome.windows.update(to.value.id!, { focused: true });
			return;
		}

		to.value = await chrome.windows.create({
			url,
			type: 'panel',
			width: 390,
			height: 844,
		});

		const qrCodeId = to.value.id;

		return new Promise<void>(accpet => {
			const onClosed = (id: number) => {
				if (id != qrCodeId) {
					return;
				}

				chrome.windows.onRemoved.removeListener(onClosed);

				to!.value = undefined;

				accpet();
			};

			chrome.windows.onRemoved.addListener(onClosed);
		});
	}

	private _addPort(port: chrome.runtime.Port) {
		console.log('add port', port);
		this._ports.add(port);

		port.onDisconnect.addListener(port => {
			this._ports.delete(port);
			console.log('delete port', port, this._ports);
		});
	}

	private _handle(
		request: any,
		sender: chrome.runtime.MessageSender,
		resp: (response?: any) => void,
	) {
		console.log('dispatch', request, sender.url);
		this.dispatch(sender, request)
			.then(result => {
				console.log(request, 'resp', result);
				resp({ result });
			})
			.catch(error => {
				console.log(request, 'error', error);
				resp({ error: `${error}` });
			});

		return true;
	}

	private _mutexEnter(sender: chrome.runtime.MessageSender) {
		if (this._isFromPopup(sender)) {
			return;
		}

		this._windows.forEach(it => {
			if (it.value) {
				chrome.windows.update(it.value.id!, { focused: true });
				throw 'An earlier operation is in progress';
			}
		});
	}

	private _isFromPopup(sender: chrome.runtime.MessageSender): boolean {
		if (sender.url?.startsWith(this._popupBaseURL)) {
			return true;
		}

		return false;
	}

	private _context(hostname: string): WebSiteContext {
		let context = this._contexts.get(hostname);

		if (!context) {
			context = { hostname, index: 0 };

			this._contexts.set(hostname, context);
		}

		return context;
	}

	private async _addChain(hostname: string, chain: AddEthereumChainParameter) {
		const context = this._context(hostname);

		const url = `${this._popupBaseURL}/addchain?eid=${chrome.runtime.id}&args=${btoa(
			JSON.stringify(chain),
		)}&origin=${hostname}`;

		await this._popupWindow('addChain', url);

		if (!_.isEqual(chain, context.chain)) {
			this._emit('notification', {
				type: 'basic',
				title: 'WalletProxy',
				message: 'Add chain canceled by user',
				iconUrl: chrome.runtime.getURL('assets/icon.png'),
			});

			throw 'User canceled';
		}
	}

	private async _switchChain(hostname: string, chain: SwitchEthereumChainParameter) {
		const context = this._context(hostname);

		const url = `${this._popupBaseURL}/switchchain?eid=${chrome.runtime.id}&&chainid=${chain.chainId}&origin=${hostname}`;

		await this._popupWindow('switchChain', url);

		if (parseInt(chain.chainId) != parseInt(context.chain?.chainId ?? '')) {
			this._emit('notification', {
				type: 'basic',
				title: 'WalletProxy',
				message: 'Add chain canceled by user',
				iconUrl: chrome.runtime.getURL('assets/icon.png'),
			});

			throw 'User canceled';
		}
	}

	private async __addChain(hostname: string, chain: AddEthereumChainParameter) {
		const context = this._context(hostname);

		context.chain = chain;

		const data: any = {};

		data[`chain_${parseInt(chain.chainId)}`] = chain;

		data[`current_chain_${btoa(hostname)}`] = chain;

		await chrome.storage.sync.set(data);

		this._contexts.forEach(it => {
			if (it.chain?.chainId && parseInt(it.chain.chainId) == parseInt(chain.chainId)) {
				it.chain = chain;
				it.index = 0;
				it.provider = undefined; // close provider
			}
		});

		this._emit('chainChanged', chain.chainId);
	}

	private async _currentChain(hostname: string): Promise<AddEthereumChainParameter> {
		const key = `current_chain_${btoa(hostname)}`;

		let chain = await chrome.storage.sync.get(key);

		if (!chain[key]) {
			const object: any = {};
			object[key] = defaultChain;
			object[`chain_${parseInt(defaultChain.chainId)}`] = defaultChain;

			await chrome.storage.sync.set(object);

			return defaultChain;
		}

		return chain[key];
	}

	private async _chains(): Promise<AddEthereumChainParameter[]> {
		const values = await chrome.storage.sync.get(undefined);

		const chains = new Array<AddEthereumChainParameter>();

		for (let key in values) {
			if (key.startsWith('chain_')) {
				chains.push(values[key]);
			}
		}

		return chains;
	}

	private async _clearChains() {
		const values = await chrome.storage.sync.get(undefined);

		const chains = new Array<string>();

		for (let key in values) {
			if (key.startsWith('current_chain_') || key.startsWith('chain_')) {
				chains.push(key);
			}
		}

		await chrome.storage.sync.remove(chains);

		this._contexts.forEach(it => {
			it.chain = undefined;
			it.index = 0;
			it.provider = undefined; // close provider
		});
	}

	private async _removeChain(id: string) {
		const values = await chrome.storage.sync.get(undefined);

		const chains = new Array<string>(`chain_${parseInt(id)}`);

		for (let key in values) {
			if (key.startsWith('current_chain_') || key.startsWith('chain_')) {
				if (parseInt(values[key].chainId) == parseInt(id)) {
					chains.push(key);
				}
			}
		}

		await chrome.storage.sync.remove(chains);

		this._contexts.forEach(it => {
			if (it.chain?.chainId && parseInt(it.chain.chainId) == parseInt(id)) {
				it.chain = undefined;
				it.index = 0;
				it.provider = undefined; // close provider
			}
		});
	}

	private async _apiKeys(): Promise<any> {
		const values = await chrome.storage.sync.get(undefined);

		const keys: any = {};

		for (let key in values) {
			if (key.startsWith('_api_key_')) {
				const k = key.substring(9);

				const v = values[key];

				if (k == 'INFURA_API_KEY' && v == defaultInfuraKey) {
					continue;
				}

				keys[k] = v;
			}
		}

		return keys;
	}

	private async _setKey(name: string, value: string) {
		const key = `_api_key_${name}`;

		const object: any = {};

		object[key] = value;

		await chrome.storage.sync.set(object);

		this._contexts.forEach(it => {
			if (it.apiKeyName == name) {
				it.provider = undefined;
			}
		});
	}

	private async _deleteAPIKey(name: string) {
		const key = `_api_key_${name}`;
		await chrome.storage.sync.remove(key);

		this._contexts.forEach(it => {
			if (it.apiKeyName == name) {
				it.provider = undefined;
			}
		});
	}

	private async _apiKey(name: string): Promise<string | undefined> {
		const key = `_api_key_${name}`;
		const values = await chrome.storage.sync.get(key);

		if (!values[key] && name == 'INFURA_API_KEY') {
			console.log('add default INFURA_API_KEY');
			await chrome.storage.sync.set({
				_api_key_INFURA_API_KEY: defaultInfuraKey,
			});

			return defaultInfuraKey;
		}

		return values[key];
	}

	private async _showingQrCode(hostname: string) {
		const url = `${this._popupBaseURL}/qrcode?eid=${chrome.runtime.id}`;

		await this._popupWindow('qrCode', url);

		if (!this._walletConnect.connected) {
			this._emit('notification', {
				type: 'basic',
				title: 'WalletProxy',
				message: 'Connecting canceled by user',
				iconUrl: chrome.runtime.getURL('assets/icon.png'),
			});

			throw 'User canceled';
		}
	}

	private async _openProvider(hostname: string) {
		const context = this._context(hostname);

		if (!context.chain) {
			context.chain = await this._currentChain(hostname);

			context.index = 0;
		}

		if (!context.chain.rpcUrls.length) {
			throw `${context.chain.chainId} rpc URLs not found`;
		}

		let loops = 0;

		while (true) {
			if (context.index > context.chain.rpcUrls.length) {
				if (loops >= context.chain.rpcUrls.length) {
					throw `Invalid RPCs for '${context.chain?.chainName}'`;
				}

				context.index = 0;

				continue;
			}

			let rpcUrl = context.chain?.rpcUrls[context.index]!;

			const matchArray = rpcUrl.match(/\${([^\$]+)}/);

			if (matchArray) {
				const key = await this._apiKey(matchArray[1]);

				if (!key) {
					loops++;
					context.index++;
					continue;
				}

				rpcUrl = rpcUrl.replace(matchArray[0], key);

				context.apiKeyName = matchArray[1];
			}

			if (rpcUrl.startsWith('wss://') || rpcUrl.startsWith('ws://')) {
				context.provider = new providers.WebSocketProvider(rpcUrl);
			} else {
				context.provider = new providers.JsonRpcProvider(rpcUrl);
			}

			context.index++;

			break;
		}

		this._emit('chainChanged', context.chain.chainId);
	}

	async dispatch(sender: chrome.runtime.MessageSender, args: RequestArguments): Promise<any> {
		this._mutexEnter(sender);

		const url = new URL(sender.url!);

		let hostname = url.hostname;

		if ('chainlist.org' == hostname) {
			const origin = url.searchParams.get('origin');

			if (origin) {
				hostname = origin;
			}
		}

		switch (args.method) {
			case 'wallet_addEthereumChain': {
				await this._addChain(hostname, args.params[0]);
				return;
			}
			case 'wallet_switchEthereumChain': {
				await this._switchChain(hostname, args.params[0]);
				return;
			}
			case 'wp_refreshWalletConnect': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}
				await this.disconnect();
				return this._walletConnect.uri;
			}
			case 'wp_addEthereumChain': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}
				await this.__addChain(args.params[0], args.params[1]);
				return;
			}
			case 'wp_chains': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._chains();
			}
			case 'wp_current_chain': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._currentChain(args.params[0]);
			}
			case 'wp_clear_chains': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._clearChains();
			}
			case 'wp_bridge_url': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._getBridge();
			}
			case 'wp_bridge_set_url': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._setBridge(args.params[0]);
			}
			case 'wp_delete_chain': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._removeChain(args.params[0]);
			}
			case 'wp_api_keys': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._apiKeys();
			}
			case 'wp_set_api_key': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._setKey(args.params[0], args.params[1]);
			}
			case 'wp_delete_api_key': {
				if (!this._isFromPopup(sender)) {
					throw new Error('Unauthorized access');
				}

				return await this._deleteAPIKey(args.params[0]);
			}
		}

		if (!this._isFromPopup(sender)) {
			if (!this._walletConnect.connected) {
				await this._walletConnect.createSession();
				await this._showingQrCode(hostname);
			}
		}

		const context = this._context(hostname);

		if (!context.provider) {
			await this._openProvider(hostname);
		}

		let resp: any;

		switch (args.method) {
			case 'eth_chainId':
			case 'net_version': {
				return context.chain!.chainId;
			}
			case 'eth_accounts':
			case 'eth_requestAccounts':
				console.log(this._walletConnect);
				resp = this._walletConnect.accounts;
				break;
			case 'eth_sendTransaction':
				resp = await this._walletConnect?.sendTransaction(args.params[0]);
				break;
			case 'eth_signTypedData_v4':
				resp = await this._walletConnect?.signTypedData(args.params);
				break;
			case 'personal_sign':
				resp = await this._walletConnect?.signPersonalMessage(args.params);
				break;
			default:
				console.log('json rpc call', args);
				resp = await context.provider!.send(args.method, args.params);
				break;
		}

		return resp;
	}

	private get _popupBaseURL(): string {
		if (process.env.NODE_ENV != 'production') {
			return 'http://127.0.0.1:4000/popup/#';
		}

		return chrome.runtime.getURL('popup/index.html#');
	}

	async connect() {
		const session = await this._getSession();

		if (session) {
			this._walletConnect = new WalletConnect({ session });
		} else {
			const bridge = await this._getBridge();

			this._walletConnect = new WalletConnect({
				bridge,
				clientMeta: {
					description: 'Web3 wallet extension',
					url: 'https://walletconnect.org',
					icons: ['https://walletconnect.org/walletconnect-logo.png'],
					name: 'WalletProxy',
				},
			});

			await this._walletConnect.createSession();
		}

		this._walletConnect.on('connect', async (error, payload) => {
			if (error) {
				this._emit('error', error);
				return;
			}

			await this._saveSession(this._walletConnect.session);

			const qrCode = this._window('qrCode');

			if (qrCode.value) {
				chrome.windows.remove(qrCode.value.id!);
			}

			this._emit('connect', { chainId: this._walletConnect.chainId });
			this._emit('accountsChanged', this._walletConnect.accounts);

			this._emit('notification', {
				type: 'basic',
				title: 'WalletProxy',
				message: `Wallet connected ${this._walletConnect.accounts}`,
				iconUrl: chrome.runtime.getURL('assets/icon.png'),
			});
		});

		this._walletConnect.on('disconnect', async (error, payload) => {
			console.log('wallet disconnect', payload);
			if (error) {
				this._emit('error', error);
			}

			this._emit('notification', {
				type: 'basic',
				title: 'WalletProxy',
				message: `Wallet disconnected ${this._walletConnect.accounts}`,
				iconUrl: chrome.runtime.getURL('assets/icon.png'),
			});

			await this._removeSession();

			this._walletConnect?.transportClose();

			await this.connect();

			this._emit('disconnect', { message: error?.message, code: -1 });
		});
	}

	public async disconnect() {
		await this._removeSession();
		if (this._walletConnect?.connected) {
			await this._walletConnect!.killSession();
			this._walletConnect.accounts = [];
		} else {
			this._walletConnect?.transportClose();
			this._walletConnect.accounts = [];
			await this.connect();
		}
	}

	private async _emit(event: string, data: any) {
		switch (event) {
			case 'notification': {
				chrome.notifications.create(data);
				break;
			}
			case 'error': {
				const opt: chrome.notifications.NotificationOptions<true> = {
					type: 'basic',
					title: 'Wallet proxy chrome extension error',
					message: `${data}`,
					iconUrl: chrome.runtime.getURL('assets/icon.png'),
				};

				chrome.notifications.create(opt);
				break;
			}
			default: {
				console.log('dispatch emit', event, data);
				this._ports.forEach(port => {
					port.postMessage({
						method: event,
						params: [data],
					});
				});
			}
		}
	}

	private async _getBridge() {
		const resultSet = await chrome.storage.sync.get('_wc_bridge_url');

		if (resultSet['_wc_bridge_url']) {
			return resultSet['_wc_bridge_url'];
		}

		console.log('set default url');

		await chrome.storage.sync.set({
			_wc_bridge_url: defaultBridgeURL,
		});

		return defaultBridgeURL;
	}

	private async _setBridge(url: string) {
		console.log('set url', url);
		await chrome.storage.sync.set({
			_wc_bridge_url: url,
		});

		await this.disconnect();
	}

	private async _getSession(): Promise<IWalletConnectSession | undefined> {
		const resultSet = await chrome.storage.local.get('_wc_session');

		if (resultSet['_wc_session']) {
			return resultSet['_wc_session'];
		}

		return undefined;
	}

	private async _saveSession(session: IWalletConnectSession) {
		await chrome.storage.local.set({
			_wc_session: session,
		});
	}

	private async _removeSession() {
		await chrome.storage.local.remove('_wc_session');
	}
}

async function main() {
	const provider = new WalletProvider();

	await provider.connect();
}

main()
	.then(() => {})
	.catch(e => {
		console.log(e);
	});
