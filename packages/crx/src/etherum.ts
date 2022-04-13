import { RequestArguments } from './types';

/// Listener event type
type EventType = string | symbol;

/// Listener ..
type Listener = (...args: Array<any>) => void;

class EIP1193Provider {
	private _events = new Map<EventType, Set<Listener>>();

	private _idseq = 1;

	private _callbacks = new Map<number, (result: any, error?: any) => void>();

	constructor() {
		window.addEventListener('message', event => {
			if (event.source != window) {
				return;
			}

			if (event.data.type != 'content_script') {
				return;
			}

			if (event.data.id) {
				const callback = this._callbacks.get(event.data.id);

				if (callback) {
					this._callbacks.delete(event.data.id);
					callback(event.data.result, event.data.error);
				}
			} else {
				const args = event.data.params;

				const listeners = this._events.get(args.method);

				console.log(this._events, 'dispatch', args, 'to', listeners);

				if (listeners) {
					listeners.forEach(listener => {
						listener(args.params[0]);
					});
				}
			}
		});
	}

	public async request(args: RequestArguments): Promise<any> {
		return new Promise((accept, reject) => {
			const id = this._idseq;
			this._idseq++;
			const callback = (result: any, error?: string) => {
				if (error) {
					reject(new Error(error));
				} else {
					accept(result);
				}
			};

			this._callbacks.set(id, callback);

			window.postMessage({
				id,
				type: 'inject_script',
				params: args,
			});
		});
	}

	public isConnected(): boolean {
		console.log('call isConnected');
		return true;
	}

	/**
	 * metamask compatibility method
	 * @returns return accounts
	 */
	public async enable(): Promise<any> {
		return await this.request({ method: 'eth_requestAccounts', params: [] });
	}

	/**
	 * metamask compatibility method
	 */
	public async send(method: any, params?: Array<unknown>): Promise<any> {
		console.log('send', method, params);

		let args: any;

		if (method.method) {
			args = {
				method: method.method,
				params: method.params,
			};
		} else {
			args = {
				method,
				params: params ?? [],
			};
		}

		let resp = await this.request(args);

		resp = {
			id: undefined,
			jsonrpc: '2.0',
			result: resp,
		};

		console.log('send', method, params, resp);

		return resp;
	}

	/**
	 * metamask compatibility method
	 */
	public async selectedAddress(): Promise<any> {
		console.log('call selectedAddress');
		return this.request({ method: 'eth_accounts', params: [] });
	}

	/**
	 * metamask compatibility method
	 */
	public async sendAsync(payload: any, callback: any) {
		console.log('call sendAsync', payload, callback);
		this.request(payload)
			.then((result: any) => {
				console.log('call sendAsync result:', result);

				callback(undefined, {
					id: payload.id,
					jsonrpc: '2.0',
					result: result,
				});
			})
			.catch((error: Error) => {
				console.log('call sendAsync error: ', error);
				callback(error);
			});
	}

	public addListener(eventName: EventType, listener: Listener) {
		this.on(eventName, listener);
	}

	public once(eventName: EventType, listener: Listener) {
		console.log('once');
	}

	on(event: EventType, listener: Listener) {
		console.log('addListener', event, listener);
		let listeners = this._events.get(event);

		if (!listeners) {
			listeners = new Set();
			this._events.set(event, listeners);
		}

		listeners.add(listener);

		console.log('add listener', event, this._events);
	}

	removeListener(event: EventType, listener: Listener) {
		const listeners = this._events.get(event);

		listeners?.delete(listener);
	}

	public prependListener(eventName: EventType, listener: Listener) {
		console.log('prependListener');
	}

	public prependOnceListener(eventName: EventType, listener: Listener) {
		console.log('prependOnceListener');
	}
}

interface IEthereum {
	request: (args: RequestArguments) => Promise<any>;
	isConnected?: () => boolean;
	enable?: () => Promise<any>;
	send?: (method: string, params?: Array<unknown>) => Promise<any>;
	networkVersion?: () => Promise<string>;
	chainId?: () => Promise<string>;
	selectedAddress?: () => Promise<any[]>;
	sendAsync?: (payload: any, callback: any) => void;
	addListener?: (eventName: EventType, listener: Listener) => this;
	once?: (eventName: EventType, listener: Listener) => this;
	prependListener?: (eventName: EventType, listener: Listener) => this;
	prependOnceListener?: (eventName: EventType, listener: Listener) => this;
	on: (eventName: EventType, listener: Listener) => this;
	removeListener: (eventName: EventType, listener: Listener) => this;
	isMetaMask?: boolean;
	_metamask?: any;
	_maxListeners: number;
}

function useEthereum(isMetaMask: boolean): IEthereum {
	const provider = new EIP1193Provider();

	const etherum: IEthereum = {
		request: async (args: RequestArguments) => {
			return await provider.request(args);
		},
		isConnected: () => {
			return provider.isConnected();
		},
		enable: async () => {
			return await provider.enable();
		},
		send: async (method: string, params?: Array<unknown>) => {
			return await provider.send(method, params);
		},
		sendAsync: (payload: any, callback: any) => {
			provider.sendAsync(payload, callback);
		},
		addListener: (eventName: EventType, listener: Listener) => {
			provider.addListener(eventName, listener);
			return etherum;
		},
		on: (eventName: EventType, listener: Listener) => {
			provider.on(eventName, listener);
			return etherum;
		},
		once: (eventName: EventType, listener: Listener) => {
			provider.once(eventName, listener);
			return etherum;
		},
		prependListener: (eventName: EventType, listener: Listener) => {
			provider.prependListener(eventName, listener);
			return etherum;
		},
		prependOnceListener: (eventName: EventType, listener: Listener) => {
			provider.prependOnceListener(eventName, listener);
			return etherum;
		},
		removeListener: (eventName: EventType, listener: Listener) => {
			provider.removeListener(eventName, listener);
			return etherum;
		},
		isMetaMask: isMetaMask,
		_metamask: {
			isUnlocked: async () => {
				console.log('call isUnlocked');
				return true;
			},
			requestBatch: async (requests: any) => {
				console.log('requestBatch', requests);
			},
		},
		_maxListeners: 100,
	};

	return etherum;
}

(window as any).ethereum = useEthereum(true);

console.log('inject etherum -- success');
