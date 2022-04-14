function injectScript(filepath: string) {
	var script = document.createElement('script');
	script.setAttribute('type', 'text/javascript');
	script.setAttribute('src', filepath);
	(document.head || document.documentElement).appendChild(script);
}

injectScript(chrome.runtime.getURL('etherum.js'));

let port: chrome.runtime.Port | undefined;

function _connectPort() {
	if (port) {
		return;
	}

	port = chrome.runtime.connect();

	port.onMessage.addListener(request => {
		console.log('inject receive', request);
		window.postMessage({
			type: 'content_script',
			params: request,
		});
	});

	port.onDisconnect.addListener(() => {
		port = undefined;
	});
}

window.addEventListener('message', event => {
	if (event.source != window) {
		return;
	}

	if (event.data.type != 'inject_script') {
		return;
	}

	_connectPort();

	chrome.runtime.sendMessage(event.data.params, resp => {
		console.log(event.data.params, 'resp', resp);

		if (!resp) {
			window.postMessage({
				id: event.data.id,
				type: 'content_script',
				error: `${chrome.runtime.lastError?.message}`,
			});

			return;
		}

		if (resp.error) {
			console.log(event.data.params, 'error', resp.error);
			window.postMessage({
				id: event.data.id,
				type: 'content_script',
				error: resp.error,
			});
		} else {
			console.log(event.data.params, 'resp', resp.result);
			window.postMessage({
				id: event.data.id,
				type: 'content_script',
				result: resp.result,
			});
		}
	});
});
