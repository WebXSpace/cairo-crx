<template>
	<div class="bridge-url">
		<wx-form>
			<form-field name="OFFICAL URL">
				<wx-switch v-model:on="officalURL" class="switch"></wx-switch>
			</form-field>

			<form-field name="CUSTOM URL" v-if="!officalURL">
				<form-input class="url" v-model:text="text"></form-input>
				<template #footer>
					<a class="error" v-if="validorError">{{ validorError }}</a>
				</template>
			</form-field>
		</wx-form>

		<wx-button
			text="CONFIRM"
			class="button"
			@click="confirm"
			background="var(--webx-danger)"
			color="var(--webx-background)"
			:disabled="!commitable"
		></wx-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { FormInput, FormField, wxButton, wxSwitch, wxForm } from '@webxspace/webxui';

import { useWalletProxy } from './chrome';
import { computed } from '@vue/reactivity';

const offical = 'https://bridge.walletconnect.org';

export default defineComponent({
	components: {
		wxForm,
		FormField,
		FormInput,
		wxButton,
		wxSwitch,
	},
	emits: ['closed'],
	setup(props, { emit }) {
		const text = ref('');

		const walletProxy = useWalletProxy();

		let _originURL = ref('');

		onMounted(async () => {
			_originURL.value = await walletProxy.bridgeURL();
			text.value = _originURL.value;

			if (text.value.toLocaleLowerCase() == offical) {
				officalURL.value = true;
			} else {
				officalURL.value = false;
			}
		});

		const officalURL = ref(false);

		const confirm = async () => {
			if (!commitable.value) {
				return;
			}

			await walletProxy.setBridgeURL(officalURL.value ? offical : text.value);
			emit('closed');
		};

		const commitable = computed(() => {
			if (
				(officalURL.value && _originURL.value != offical) ||
				(!validorError.value && _originURL.value != text.value)
			) {
				return true;
			}

			return false;
		});

		const validorError = computed(() => {
			if (text.value == '' || officalURL.value) {
				return undefined;
			}

			try {
				new URL(text.value);
			} catch {
				return 'Invalid url';
			}
		});

		return {
			commitable,
			validorError,
			confirm,
			officalURL,
			text,
		};
	},
});
</script>

<style css scoped>
.bridge-url {
	width: calc(100% - 2 * var(--webx-padding-size));
	height: calc(100% - 2 * var(--webx-padding-size));
	padding: var(--webx-padding-size);
	display: flex;
	flex-direction: column;
}

.button {
	margin-top: auto;
	margin-bottom: 1em;
	margin-inline: auto;
}

.switch {
	margin-left: auto;
}

.error {
	align-self: flex-end;
	color: var(--webx-danger);
	font-size: 0.6em;
	font-weight: 600;
	margin-block: 0.5em;
}
</style>
