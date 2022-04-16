<template>
	<page :title="t('SWITCH CHAIN')" class="switch-chain">
		<div class="loading" v-if="loading">
			<loading size="1.5em"></loading> <a class="loading-tip"> {{ t('Loading data ...') }}</a>
		</div>

		<wx-form v-if="!loading">
			<wx-linker :href="loadFrom" class="info" :text="t('Auto fill warning')"> </wx-linker>
			<chain-editor v-model:parameter="chainParameter"></chain-editor>
		</wx-form>

		<div class="error" v-if="errorMessage">
			<icon class="icon" color="var(--webx-danger)" name="warning"></icon>{{ errorMessage! }}
		</div>

		<wx-button
			class="button"
			:text="t('CONFIRM')"
			background="var(--webx-danger)"
			color="var(--webx-background)"
			@click="confirm"
			:disabled="disabled"
		></wx-button>
	</page>
</template>

<script lang="ts">
import Page from './Page.vue';
import ChainEditor from './ChainEditor.vue';

import { useRouter } from 'vue-router';
import { defineComponent, onMounted, ref, toRefs, watch } from 'vue';

import { AddEthereumChainParameter, useWalletProxy, gobackOrClose } from './chrome';
import {
	FormField,
	FormInput,
	FormTextArea,
	wxButton,
	Loading,
	Icon,
	Link as wxLinker,
	wxForm,
} from '@webxspace/webxui';

import { t } from '@webxspace/webxui';

export default defineComponent({
	components: {
		wxForm,
		wxLinker,
		Page,
		FormField,
		FormInput,
		FormTextArea,
		ChainEditor,
		wxButton,
		Loading,
		Icon,
	},
	setup() {
		const router = useRouter();

		const chainParameter = ref<AddEthereumChainParameter>({
			chainId: '',
			chainName: '',
			nativeCurrency: {
				name: '',
				symbol: '',
				decimals: 0,
			},
			rpcUrls: [],
			blockExplorerUrls: undefined,
			iconUrls: undefined,
		});

		const loading = ref(false);

		const loadFrom = ref('https://chainid.network/chains.json');

		onMounted(async () => {
			loading.value = true;
			const resp = await fetch(loadFrom.value);

			if (resp.ok) {
				const chains = (await resp.json()) as AddEthereumChainParameter[];

				const chainId = parseInt(router.currentRoute.value.query.chainid as string);

				const chain = chains.find(it => {
					return parseInt(it.chainId) == chainId;
				});

				if (chain) {
					chain.chainName = chain.name;
					chain.blockExplorerUrls = chain.explorers?.map(it => {
						return it.url;
					});
					chain.rpcUrls = chain.rpc;
					chainParameter.value = chain;
				}
			}

			loading.value = false;
		});

		const walletProxy = useWalletProxy();

		const validRpc = (rpcs: string[]) => {
			for (let rpc of rpcs) {
				if (rpc != '') {
					try {
						new URL(rpc);
					} catch {
						return false;
					}
				}
			}

			return true;
		};

		const errorMessage = ref<string>();

		const disabled = ref(false);

		watch(chainParameter, value => {
			errorMessage.value = undefined;

			if (!value.rpcUrls || !validRpc(value.rpcUrls)) {
				errorMessage.value = 'Invalid rpcURLs';
				disabled.value = true;
				return;
			}

			if (value.blockExplorerUrls && !validRpc(value.blockExplorerUrls)) {
				errorMessage.value = 'Invalid blockExplorerUrls';
				disabled.value = true;

				return;
			}

			if (
				value.chainId &&
				value.chainName &&
				value.nativeCurrency.name &&
				value.nativeCurrency.symbol &&
				value.nativeCurrency.decimals
			) {
				disabled.value = false;
			} else {
				errorMessage.value = 'REQUIRED';
				disabled.value = true;
			}
		});

		const confirm = async () => {
			const blockExplorerUrls = chainParameter.value.blockExplorerUrls?.filter(it => {
				return it != '';
			});

			chainParameter.value.blockExplorerUrls = Array.from(new Set(blockExplorerUrls));

			const rpcUrls = chainParameter.value.rpcUrls?.filter(it => {
				return it != '';
			});

			chainParameter.value.rpcUrls = Array.from(new Set(rpcUrls));

			const origin = router.currentRoute.value.query.origin as string;

			await walletProxy.addChain(origin, chainParameter.value);

			gobackOrClose(router);
		};

		return {
			t,
			loadFrom,
			loading,
			errorMessage,
			disabled,
			confirm,
			chainParameter,
		};
	},
});
</script>

<style css scoped>
.button {
	margin-block: auto;
}

.error {
	margin-block: var(--webx-padding-size);
	height: 1em;
	font-weight: 600;
	font-size: 0.8em;
	text-align: end;
	width: 100%;
	color: var(--webx-danger);
	display: flex;
	align-items: center;
	justify-content: end;
}

.icon {
	width: 1em;
	height: 1em;
	margin-right: 0.5em;
}

.info {
	margin-block: var(--webx-padding-size);
	font-weight: 100;
	font-size: 0.8em;
	margin-left: auto;
	width: fit-content;
}

.loading {
	margin-block: auto;
	display: flex;
	align-items: center;
}

.loading-tip {
	margin-left: 1em;
	font-weight: 600;
	color: var(--webx-secondary);
	font-size: 0.8em;
}
</style>
