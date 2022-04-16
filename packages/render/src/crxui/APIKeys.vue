<template>
	<div class="api-keys">
		<div class="input-line">
			<form-input
				class="input-item"
				:placeholder="t('API keys name')"
				v-model:text="name"
			></form-input>
			<a class="split">&nbsp;-&nbsp;</a>
			<form-input
				class="input-item"
				:placeholder="t('API keys value')"
				v-model:text="value"
			></form-input>

			<wx-button
				:text="t('ADD')"
				class="button"
				color="var(--webx-background)"
				background="var(--webx-danger)"
				@click="onAdd"
				:disabled="!isValid"
			></wx-button>
		</div>
		<div class="list" v-focus="'list'">
			<api-key-item
				v-for="key of keys"
				:name="key.name"
				:value="key.value"
				@delete="onDelete(key.name)"
			></api-key-item>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from 'vue';
import { FormInput, wxButton } from '@webxspace/webxui';
import apiKeyItem from './APIKeyItem.vue';
import { useWalletProxy } from './chrome';
import { t } from '@webxspace/webxui';

export default defineComponent({
	components: {
		FormInput,
		wxButton,
		apiKeyItem,
	},
	setup() {
		const name = ref('');

		const value = ref('');

		const keys = ref<{ name: string; value: string }[]>();

		const walletProxy = useWalletProxy();

		const onUpdate = async () => {
			const values = await walletProxy.apiKeys();

			const array = [];

			for (let key in values) {
				array.push({ name: key, value: values[key] });
			}

			keys.value = array;

			console.log(values);
		};

		onMounted(onUpdate);

		const onDelete = async (name: string) => {
			await walletProxy.deleteAPIKey(name);
			await onUpdate();
		};

		const isValid = computed(() => {
			if (name.value && value.value) {
				return true;
			}

			return false;
		});

		const onAdd = async () => {
			if (!isValid.value) {
				return;
			}

			await walletProxy.setAPIKey(name.value, value.value);

			name.value = '';

			value.value = '';

			await onUpdate();
		};

		return {
			t,
			isValid,
			onAdd,
			onDelete,
			keys,
			name,
			value,
		};
	},
});
</script>

<style css scoped>
.button {
	font-size: 0.8em;
	margin-left: auto;
}

.input-line {
	display: flex;
	align-items: center;
}

.input-item {
	flex: none !important;
	width: 26% !important;
}

.split {
	color: var(--webx-border-color);
}
.api-keys {
	width: calc(100% - 2 * var(--webx-padding-size));
	height: calc(100% - 2 * var(--webx-padding-size));
	padding: var(--webx-padding-size);
	display: flex;
	flex-direction: column;
}

.list {
	margin-block: var(--webx-padding-size);
	font-size: 0.5em;
	border-radius: var(--webx-border-radius);
	flex: 1;
	overflow-x: hidden;
}

.list-unfocus {
	border: solid var(--webx-border-width) var(--webx-border-color);
	box-shadow: inset 0 0 var(--webx-focus-shadow-width) var(--webx-shadow-color);
}
.list-hover,
.list-focus {
	border: solid var(--webx-border-width) var(--webx-accent);
	box-shadow: inset 0 0 var(--webx-focus-shadow-width) var(--webx-shadow-color);
}
</style>
