<template>
	<page :title="t('ADD ETHEREUM CHAIN')">
		<wx-form>
			<form-field :name="t('CHAIN ID')" class="field">
				<a class="form-text"> {{ args.chainId }} </a>
			</form-field>
			<form-field :name="t('CHAIN NAME')" class="field">
				<a class="form-text"> {{ args.chainName }} </a>
			</form-field>
			<form-field :name="t('NATIVE CURRENCY')" class="field" v-if="args.nativeCurrency">
				<a class="form-text">
					{{ args.nativeCurrency.name }}({{ args.nativeCurrency.symbol }}) -
					{{ args.nativeCurrency.decimals }}
				</a>
			</form-field>
			<form-field :name="t('RPC URLs')" class="field">
				<RPCs :rpcs="args.rpcUrls"></RPCs>
			</form-field>
			<form-field :name="t('BLOCK EXPLORER URLs')" class="field">
				<RPCs :rpcs="args.blockExplorerUrls"></RPCs>
			</form-field>
		</wx-form>

		<wx-button
			:loading="loading"
			:text="t('ADD')"
			class="add"
			color="var(--webx-background)"
			background="var(--webx-danger)"
			@click="add"
		></wx-button>
	</page>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AddEthereumChainParameter, useWalletProxy, gobackOrClose } from './chrome';
import { FormField, FormOption, wxButton, ToolTip, wxForm } from '@webxspace/webxui';
import Page from './Page.vue';
import RPCs from './RPCs.vue';
import { t } from '@webxspace/webxui';

export default defineComponent({
	components: {
		FormField,
		Page,
		wxButton,
		FormOption,
		ToolTip,
		RPCs,
		wxForm,
	},
	setup() {
		const router = useRouter();

		let args = computed(() => {
			if (!router.currentRoute.value.query.args) {
				throw new Error('expect args');
			}

			return JSON.parse(
				atob(router.currentRoute.value.query.args as string),
			) as AddEthereumChainParameter;
		});

		const loading = ref(false);

		const walletProxy = useWalletProxy();

		const add = async () => {
			try {
				const origin = router.currentRoute.value.query.origin as string;
				loading.value = true;
				await walletProxy.addChain(origin, args.value);
			} catch {}

			loading.value = false;

			gobackOrClose(router);
		};

		return {
			t,
			add,
			loading,
			args,
		};
	},
});
</script>

<style css scoped>
.add-chain {
	width: calc(100vw - 2 * var(--webx-padding-size));
	height: calc(100vh - 2 * var(--webx-padding-size));
	display: flex;
	flex-direction: column;
	padding: var(--webx-padding-size);
}

.field {
	align-self: flex-start;
}

.form {
	border-radius: var(--webx-border-radius);
	padding-inline: var(--webx-padding-size);
	width: calc(100% - 2 * var(--webx-padding-size));
	max-width: 360px;
	background-color: var(--webx-secondary-background);
	max-height: 500px;
	overflow-y: auto;
}

.add {
	margin-block: auto;
}

.form-text {
	font-size: 0.8em;
	color: var(--webx-secondary);
	text-align: end;
	flex: 1;
	align-self: center;
}

.form-multiline-text {
	display: flex;
	flex-direction: column;
	flex: 1;
	overflow-x: hidden;
	font-size: 0.8em;
	color: var(--webx-secondary);
	align-self: center;
	border: solid var(--webx-border-width) var(--webx-border-color);
	padding-block: calc(var(--webx-padding-size) / 2);
	padding-inline: var(--webx-padding-size);
	border-radius: var(--webx-border-radius);
	max-height: 100px;
	overflow-y: auto;
}

.form-multiline-text:hover {
	border: solid var(--webx-border-width) var(--webx-accent);
	background-color: var(--webx-background);
}

.form-text-line {
	min-height: 1em;
	margin-block: calc(var(--webx-padding-size) / 2);
	width: 100%;
	text-overflow: ellipsis;
	word-break: keep-all;
	white-space: nowrap;
	overflow-x: hidden;
	text-align: end;
}
</style>
