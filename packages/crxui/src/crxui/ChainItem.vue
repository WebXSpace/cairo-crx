<template>
	<div
		@mouseover="mouseover"
		@mouseleave="mouseleave"
		class="item"
		:class="itemClasses(item.chainId)"
		@click="onClick"
	>
		<a class="title">{{ item.chainName }}</a> &nbsp; - &nbsp;({{ parseInt(item.chainId) }})

		<icon-button
			name="delete"
			class="icon"
			:border="false"
			v-if="showingDelete"
			@click.stop="onDelete"
		></icon-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs } from 'vue';
import { AddEthereumChainParameter, useWalletProxy } from './chrome';
import { IconButton } from '@webxspace/webxui';
import { useRouter } from 'vue-router';

export default defineComponent({
	components: {
		IconButton,
	},
	props: {
		selected: {
			type: Object as PropType<AddEthereumChainParameter>,
		},
		item: {
			type: Object as PropType<AddEthereumChainParameter>,
			required: true,
		},
	},
	emits: ['update:selected', 'delete'],
	setup(props, { emit }) {
		const { selected, item } = toRefs(props);

		const itemClasses = (id: string) => {
			if (selected.value?.chainId == id) {
				return 'item-focused';
			} else {
				return undefined;
			}
		};

		const showingDelete = ref(false);

		const mouseover = () => {
			showingDelete.value = true;
		};

		const mouseleave = () => {
			showingDelete.value = false;
		};

		const walletProxy = useWalletProxy();

		const router = useRouter();

		const onClick = async () => {
			const origin = router.currentRoute.value.query.origin as string;
			await walletProxy.addChain(origin, item.value);
			emit('update:selected', item.value);
		};

		const onDelete = () => {
			emit('delete');
		};

		return {
			onDelete,
			showingDelete,
			onClick,
			itemClasses,
			mouseover,
			mouseleave,
		};
	},
});
</script>

<style css scoped>
.item {
	color: var(--webx-secondary);
	padding: var(--webx-padding-size);
	user-select: none;
	cursor: pointer;
	border-bottom: solid var(--webx-border-width) var(--webx-shadow-color);
	display: flex;
	align-items: center;
	height: 3em;
}

.item:hover {
	color: var(--webx-primary);
	background-color: var(--webx-secondary-background);
	font-size: 600;
}

.item-focused {
	color: var(--webx-primary);
	background-color: var(--webx-secondary-background);
	/* border-left: solid var(--webx-border-accent-width) var(--webx-accent); */
}

.icon {
	font-size: 2em;
	margin-left: auto;
}

.title {
	font-weight: 600;
}
</style>
