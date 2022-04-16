<template>
	<page :title="t('WALLET CONNECTING')">
		<a class="sub-title">{{ t('Scan QR code with a WalletConnect compatible wallet') }}</a>
		<div class="qrcode-border">
			<div class="loading" v-if="loading">{{ 'Loading ...' }}</div>
			<qrcode :value="uri" :size="qrCodeSize" class="qrcode-img" v-else></qrcode>
		</div>
		<wx-button
			:loading="loading"
			:text="t('REFRESH')"
			class="refresh"
			color="var(--webx-background)"
			background="var(--webx-accent)"
			@click="refresh"
		></wx-button>
	</page>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import Qrcode from 'qrcode.vue';
import { wxButton } from '@webxspace/webxui';
import { computed } from '@vue/reactivity';
import { useWalletProxy } from './chrome';
import Page from './Page.vue';
import router from '../router';
import { t } from '@webxspace/webxui';

export default defineComponent({
	components: { Qrcode, wxButton, Page },
	setup() {
		const qrCodeSize = ref(260);

		const uri = ref('https://hello.com');

		const subTitleWidth = computed(() => {
			return `${qrCodeSize.value}px`;
		});

		const walletProxy = useWalletProxy();

		const loading = ref(false);

		const refresh = async () => {
			try {
				loading.value = true;
				uri.value = await walletProxy.refresh();
			} catch {}

			loading.value = false;
		};

		onMounted(refresh);

		const onConnect = () => {
			router.back();
		};

		walletProxy.on('connect', onConnect);

		onUnmounted(() => {
			walletProxy.removeListener('connect', onConnect);
		});

		return {
			t,
			loading,
			refresh,
			subTitleWidth,
			uri,
			qrCodeSize,
		};
	},
});
</script>

<style css scoped>
.qrcode-border {
	border-radius: var(--webx-border-radius);
	overflow: hidden;
	background-color: var(--webx-secondary-background);
	padding: var(--webx-padding-size);
	display: flex;
	align-items: center;
	justify-content: center;
	width: v-bind(subTitleWidth);
	height: v-bind(subTitleWidth);
}

.sub-title {
	font-size: 0.6em;
	font-weight: 600;
	margin-bottom: 2em;
	text-align: center;
	color: var(--webx-primary);
	background-color: var(--webx-background);
	max-width: v-bind(subTitleWidth);
}

.refresh {
	margin-block: auto;
}
</style>
