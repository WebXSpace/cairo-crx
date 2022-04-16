<template>
	<div class="chains">
		<div class="tool-bar">
			<search-bar
				class="searchbar"
				v-model:text="searchText"
				:placeholder="t('Name / ID ...')"
			>
			</search-bar>
			<wx-button
				class="button"
				:text="t('Clear all')"
				color="var(--webx-background)"
				background="var(--webx-danger)"
				@click="clearAll"
			></wx-button>
		</div>

		<div class="list" v-focus="'list'">
			<chain-item
				:item="item"
				v-model:selected="selected"
				v-for="item in filterChains"
				@delete="onDelete(item)"
				:key="item.chainId"
			></chain-item>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from 'vue';
import { SearchBar, IconButton, wxForm, FormField, wxButton } from '@webxspace/webxui';
import { AddEthereumChainParameter, useWalletProxy } from './chrome';

import RPCs from './RPCs.vue';
import ChainItem from './ChainItem.vue';
import { useRouter } from 'vue-router';
import { t } from '@webxspace/webxui';

export default defineComponent({
	components: {
		FormField,
		wxForm,
		RPCs,
		SearchBar,
		IconButton,
		wxButton,
		ChainItem,
	},
	setup() {
		const searchText = ref('');

		const chains = ref<AddEthereumChainParameter[]>([]);

		const walletProxy = useWalletProxy();

		const router = useRouter();

		onMounted(async () => {
			const origin = router.currentRoute.value.query.origin as string;
			chains.value = await walletProxy.chains();
			selected.value = await walletProxy.currentChain(origin);
		});

		const filterChains = computed(() => {
			return chains.value.filter(it => {
				if (
					it.chainName?.toLocaleUpperCase().includes(searchText.value.toLocaleUpperCase())
				) {
					return true;
				}

				if (`${parseInt(it.chainId)}`.includes(`${parseInt(searchText.value)}`)) {
					return true;
				}

				return false;
			});
		});

		const selected = ref<AddEthereumChainParameter>();

		const clearAll = async () => {
			await walletProxy.clearChains();
			chains.value = await walletProxy.chains();
		};

		const onDelete = async (item: AddEthereumChainParameter) => {
			const origin = router.currentRoute.value.query.origin as string;

			await walletProxy.deleteChain(item.chainId);

			chains.value = await walletProxy.chains();
			selected.value = await walletProxy.currentChain(origin);
		};

		return {
			t,
			onDelete,
			clearAll,
			selected,
			filterChains,
			searchText,
		};
	},
});
</script>

<style css scoped>
.chains {
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

.button {
	margin-left: 1em;
	font-size: 0.5em;
}

.searchbar {
	flex: 1;
}

.tool-bar {
	display: flex;
}
</style>
