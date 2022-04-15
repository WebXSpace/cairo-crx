<template>
	<page class="options" title="OPTIONS">
		<wx-form>
			<form-field name="BRIDGE URL" class="field">
				<icon-button name="more2" class="icon" @click="showingContent = 'BridgeURL'">
				</icon-button>
				<template #footer>
					<wx-linker
						class="footer"
						href="https://docs.walletconnect.com/bridge-server"
						text="wallet connect bridge server"
					>
						<template #header>
							<icon name="question" class="footer-icon"></icon>
						</template>
					</wx-linker>
				</template>
			</form-field>
			<form-field name="API KEYs" class="field">
				<icon-button name="more2" class="icon" @click="showingContent = 'APIKeys'">
				</icon-button>
			</form-field>
			<form-field name="CHAINS" class="field">
				<icon-button name="more2" class="icon" @click="showingContent = 'Chains'">
				</icon-button>

				<template #footer>
					<wx-linker
						class="footer"
						:href="chainList"
						text="add chain via chainlist.org"
						@navigate="onNavigateToChainList"
					>
					</wx-linker>
				</template>
			</form-field>
		</wx-form>

		<wx-dialog
			mobile-height="60%"
			height="260px"
			width="400px"
			:showing="showingContent != undefined"
			@update:showing="showingContent = undefined"
		>
			<component :is="showingContent" @closed="showingContent = undefined"></component>
		</wx-dialog>
	</page>
</template>

<script lang="ts">
import { useRouter } from 'vue-router';
import { defineComponent, onMounted, onUnmounted, ref, computed } from 'vue';
import { AddEthereumChainParameter, useWalletProxy } from './chrome';

import {
	FormField,
	FormOption,
	wxButton,
	Link as wxLinker,
	IconButton,
	Icon,
	wxDialog,
	wxForm,
} from '@webxspace/webxui';

import Page from './Page.vue';
import BridgeURL from './BridgeURL.vue';
import Chains from './Chains.vue';
import APIKeys from './APIKeys.vue';

export default defineComponent({
	components: {
		Page,
		FormField,
		FormOption,
		wxButton,
		wxLinker,
		IconButton,
		wxDialog,
		BridgeURL,
		APIKeys,
		Chains,
		Icon,
		wxForm,
	},
	setup() {
		const walletProxy = useWalletProxy();

		const router = useRouter();

		const onDisconnect = () => {
			navigateToQRCode();
		};

		const navigateToQRCode = () => {
			router.push({
				name: 'qrcode',
				query: {
					eid: router.currentRoute.value.query.eid,
					goback: parseInt(router.currentRoute.value.query.goback as string) + 1,
				},
			});
		};

		walletProxy.on('disconnect', onDisconnect);

		const chains = ref<AddEthereumChainParameter[]>([]);

		const selected = ref('');

		const update = async () => {
			const origin = router.currentRoute.value.query.origin as string;
			chains.value = await walletProxy.chains();
			selected.value = (await walletProxy.currentChain(origin))?.chainName ?? '';
		};

		onMounted(update);

		onUnmounted(() => {
			walletProxy.removeListener('disconnect', onDisconnect);
		});

		const chainNames = computed(() => {
			return (
				chains.value.map(it => {
					return it.chainName!;
				}) ?? []
			);
		});

		const clearChains = async () => {
			await walletProxy.clearChains();

			await update();
		};

		const showingContent = ref<string>();

		const chainList = computed(() => {
			const origin = router.currentRoute.value.query.origin as string;
			return `https://chainlist.org/?origin=${origin}`;
		});

		const onNavigateToChainList = () => {
			console.log('==================');
			window.close();
		};

		return {
			chainList,
			onNavigateToChainList,
			showingContent,
			clearChains,
			selected,
			chainNames,
		};
	},
});
</script>

<style css scoped>
.field {
	width: 100%;
}

.option {
	margin-inline-start: auto;
}

.clear {
	margin-left: 1em;
	margin-block: auto;
	height: 1em;
}

.footer-icon {
	width: 1em;
	height: 1em;
	margin-right: 0.5em;
}
.footer {
	align-self: flex-end;
	font-size: 0.8em;
	color: var(--webx-secondary);
	margin-block-start: 0.5em;
}

.linker {
	text-decoration: underline;
}

.icon {
	margin-left: auto;
}

.api-key-more {
	margin-left: var(--webx-padding-size) !important;
}
</style>
