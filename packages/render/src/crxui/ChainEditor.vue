<template>
	<form-field :name="t('CHAIN ID')" class="field">
		<form-input v-model:text="id" type="number" placeholder="REQUIRED"></form-input>
	</form-field>
	<form-field :name="t('CHAIN NAME')" class="field">
		<form-input v-model:text="name" placeholder="REQUIRED"></form-input>
	</form-field>
	<form-field :name="t('NATIVE CURRENCY NAME')" class="field">
		<form-input v-model:text="nativeTokenName" placeholder="REQUIRED"></form-input>
	</form-field>
	<form-field :name="t('NATIVE CURRENCY SYMBOL')" class="field">
		<form-input v-model:text="nativeTokenSymbol" placeholder="REQUIRED"></form-input>
	</form-field>
	<form-field :name="t('NATIVE CURRENCY DECIMALS')" class="field">
		<form-input
			v-model:text="nativeTokenDecimals"
			placeholder="REQUIRED"
			type="number"
		></form-input>
	</form-field>
	<form-field :name="t('RPC URLs')" class="field">
		<form-text-area v-model:text="rpcURLs" placeholder="REQUIRED"></form-text-area>
	</form-field>
	<form-field :name="t('BLOCK EXPLORER URLs')" class="field">
		<form-text-area v-model:text="blockExplorerURLs"></form-text-area>
	</form-field>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs } from 'vue';
import { AddEthereumChainParameter } from './chrome';
import { FormField, FormInput, FormTextArea } from '@webxspace/webxui';
import { computed } from '@vue/reactivity';
import { t } from '@webxspace/webxui';
export default defineComponent({
	components: {
		FormField,
		FormInput,
		FormTextArea,
	},
	props: {
		parameter: {
			type: Object as PropType<AddEthereumChainParameter>,
			required: true,
		},
	},
	emits: ['update:parameter'],
	setup(props, { emit }) {
		const { parameter } = toRefs(props);

		console.log(parameter.value);

		const id = computed({
			get: () => {
				return parameter.value.chainId;
			},
			set: (value: string) => {
				const newValue = { ...parameter.value };
				newValue.chainId = value;
				emit('update:parameter', newValue);
			},
		});

		const name = computed({
			get: () => {
				console.log(parameter.value);
				return (
					parameter.value.chainName ?? parameter.value.name ?? parameter.value.chain ?? ''
				);
			},
			set: (value: string) => {
				const newValue = { ...parameter.value };
				newValue.chainName = value;
				emit('update:parameter', newValue);
			},
		});

		const nativeTokenName = computed({
			get: () => {
				return parameter.value.nativeCurrency.name;
			},
			set: (value: string) => {
				const newValue = { ...parameter.value };
				newValue.nativeCurrency.name = value;
				emit('update:parameter', newValue);
			},
		});

		const nativeTokenSymbol = computed({
			get: () => {
				return parameter.value.nativeCurrency.symbol;
			},
			set: (value: string) => {
				const newValue = { ...parameter.value };
				newValue.nativeCurrency.symbol = value;
				emit('update:parameter', newValue);
			},
		});

		const nativeTokenDecimals = computed({
			get: () => {
				return `${parameter.value.nativeCurrency.decimals}`;
			},
			set: (value: string) => {
				const newValue = { ...parameter.value };
				newValue.nativeCurrency.decimals = parseInt(value);
				emit('update:parameter', newValue);
			},
		});

		const rpcURLs = computed({
			get: () => {
				return parameter.value.rpcUrls?.join('\n') ?? '';
			},
			set: (value: string) => {
				const newValue = { ...parameter.value };
				newValue.rpcUrls = value.split('\n');
				emit('update:parameter', newValue);
			},
		});

		const blockExplorerURLs = computed({
			get: () => {
				return parameter.value.blockExplorerUrls?.join('\n') ?? '';
			},
			set: (value: string) => {
				const newValue = { ...parameter.value };
				newValue.blockExplorerUrls = value.split('\n');
				emit('update:parameter', newValue);
			},
		});

		return {
			t,
			id,
			name,
			nativeTokenName,
			nativeTokenSymbol,
			nativeTokenDecimals,
			rpcURLs,
			blockExplorerURLs,
		};
	},
});
</script>

<style css scoped></style>
