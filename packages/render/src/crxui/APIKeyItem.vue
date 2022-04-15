<template>
	<div class="api-key-item" @mouseover="mouseover" @mouseleave="mouseleave">
		<div class="title">
			<copy-text class="name" :text="name"></copy-text>
			<copy-text class="value" :text="value"></copy-text>
		</div>

		<icon-button name="delete" class="icon" :border="false" @click="onDelete"></icon-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs } from 'vue';
import { IconButton, CopyText } from '@webxspace/webxui';
import { useWalletProxy } from './chrome';

export default defineComponent({
	components: {
		CopyText,
		IconButton,
	},
	props: {
		name: {
			type: String,
			required: true,
		},
		value: {
			type: String,
			required: true,
		},
	},
	emits: ['delete'],
	setup(props, { emit }) {
		const { name } = toRefs(props);
		const showingDelete = ref(false);

		const mouseover = () => {
			showingDelete.value = true;
		};

		const mouseleave = () => {
			showingDelete.value = false;
		};

		const onDelete = () => {
			emit('delete', name.value);
		};

		return {
			onDelete,
			showingDelete,
			mouseover,
			mouseleave,
		};
	},
});
</script>

<style css scoped>
.api-key-item {
	position: relative;
	display: flex;
	color: var(--webx-secondary);
	padding: var(--webx-padding-size);
	user-select: none;
	cursor: pointer;
	border-left: solid var(--webx-border-accent-width) transparent;
	justify-content: space-between;
}

.api-key-item:hover {
	color: var(--webx-primary);
	background-color: var(--webx-secondary-background);
}

.title {
	display: flex;
	flex-direction: column;
}

.name {
	font-weight: 600;
	margin-bottom: 0.5em;
}

.icon {
	font-size: 2em;
}
</style>
