<template>
	<div class="page">
		<div class="tool-bar">
			<pop-menu>
				<icon-button name="more" class="tool-bar-button"></icon-button>
				<template #menus>
					<menu-item
						name="OPTIONS"
						icon="settings"
						@click="options"
						v-if="showingOptions"
					></menu-item>
					<menu-item
						name="DISCONNECT"
						icon="disconnect"
						@click="disconnect"
						v-if="account"
					></menu-item>
					<menu-item
						name="CONNECT"
						icon="qrcode"
						@click="connect"
						v-if="showingConnect"
					></menu-item>
				</template>
			</pop-menu>
			<tool-tip :content="account" direction="bottom" v-if="account">
				<copy-text class="accout" :text="accountShort(account)"></copy-text>
			</tool-tip>
			<icon-button
				class="tool-bar-button goback"
				name="arrow-left"
				@click="goback"
				v-if="showingGoBack"
			></icon-button>
		</div>
		<a class="title">{{ title }}</a>
		<slot></slot>
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { IconButton, PopMenu, MenuItem, CopyText, ToolTip } from '@webxspace/webxui';
import { useWalletProxy } from './chrome';
import { computed } from '@vue/reactivity';
import { useRouter } from 'vue-router';

export default defineComponent({
	components: {
		IconButton,
		PopMenu,
		MenuItem,
		CopyText,
		ToolTip,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
	},
	setup() {
		const walletProxy = useWalletProxy();

		const account = ref<string>();

		const fetchAccount = async () => {
			const accounts = await walletProxy.accounts();

			if (accounts?.length) {
				account.value = accounts[0];
			} else {
				account.value = '';
			}
		};

		onMounted(fetchAccount);

		const onDisconnect = () => {
			account.value = '';
		};

		const onConnect = (accounts: string[]) => {
			account.value = accounts[0];
		};

		walletProxy.on('accountsChanged', onConnect);
		walletProxy.on('disconnect', onDisconnect);

		onUnmounted(() => {
			walletProxy.removeListener('accountsChanged', onConnect);
			walletProxy.removeListener('disconnect', onDisconnect);
		});

		const accountShort = (value: string) => {
			return value.substring(0, 8) + '...' + value.substring(value.length - 6);
		};

		const showingGoBack = computed(() => {
			if (router.currentRoute.value.query.goback) {
				return true;
			}

			return false;
		});

		const goback = () => {
			history.back();
		};

		const disconnect = async () => {
			await walletProxy.refresh();
		};

		const router = useRouter();

		const connect = async () => {
			router.push({
				name: 'qrcode',
				query: {
					eid: router.currentRoute.value.query.eid,
					goback: parseInt(router.currentRoute.value.query.goback as string) + 1,
				},
			});
		};

		const showingConnect = computed(() => {
			return router.currentRoute.value.name != 'qrcode' && account.value == '';
		});

		const showingOptions = computed(() => {
			return router.currentRoute.value.name != 'options';
		});

		const options = () => {
			router.push({
				name: 'options',
				query: {
					eid: router.currentRoute.value.query.eid,
					goback: parseInt(router.currentRoute.value.query.goback as string) + 1,
				},
			});
		};

		return {
			options,
			showingOptions,
			showingConnect,
			connect,
			disconnect,
			goback,
			showingGoBack,
			accountShort,
			account,
		};
	},
});
</script>

<style css scoped>
.page {
	max-width: 800px;
	width: calc(100vw - 2 * var(--webx-padding-size));
	height: calc(100vh - 2 * var(--webx-padding-size));
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: var(--webx-padding-size);
}

.title {
	margin-block-start: var(--webx-padding-size);
	margin-block-end: 1em;
	align-self: flex-start;
	font-size: 2em;
	font-weight: 900;
	color: var(--webx-accent);
}

.tool-bar {
	height: 2em;
	display: flex;
	align-items: center;
	flex-direction: row-reverse;
	width: 100%;
}

.tool-bar-button {
	width: 1em;
	height: 1em;
}

.accout {
	max-width: 200px;
	margin-right: 1em;
	overflow: hidden;
	font-size: 0.8em;
	color: var(--webx-secondary);
	border: solid var(--webx-border-width) var(--webx-border-color);
	padding-inline: var(--webx-padding-size);
	padding-block: calc(var(--webx-padding-size) / 2);
	border-radius: var(--webx-border-radius);
	cursor: pointer;
}

.goback {
	margin-right: auto;
}
</style>
