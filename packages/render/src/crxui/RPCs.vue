<template>
	<div class="rpcs">
		<icon name="more2" class="icon" @click="showing = true"> </icon>

		<wx-dialog v-model:showing="showing">
			<div class="form">
				<tool-tip :content="rpc" direction="bottom" v-for="rpc in rpcs">
					<copy-text :text="rpc" class="linker" color="var(--webx-secondary)"></copy-text>
				</tool-tip>
			</div>
		</wx-dialog>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { Icon, PopMenu, wxDialog, CopyText, ToolTip } from '@webxspace/webxui';

export default defineComponent({
	components: {
		Icon,
		PopMenu,
		wxDialog,
		CopyText,
		ToolTip,
	},
	props: {
		rpcs: {
			type: Object as PropType<string[]>,
			requied: true,
		},
	},
	setup() {
		const showing = ref(false);

		return {
			showing,
		};
	},
});
</script>

<style css scoped>
.rpcs {
	margin-block: auto;
	border: solid var(--webx-border-width) var(--webx-border-color);
	padding: 0.2em;
	border-radius: var(--webx-border-radius);
	margin-left: auto;
	user-select: auto;
	cursor: pointer;
}

.icon {
	width: 1em;
	height: 1em;
	display: flex;
	align-items: center;
	justify-content: center;
}

.form {
	padding: var(--webx-padding-size);
	margin: var(--webx-padding-size);
	width: calc(100% - 4 * var(--webx-padding-size));
	background-color: var(--webx-secondary-background);
	height: calc(100% - 4 * var(--webx-padding-size));
	border-radius: var(--webx-border-radius);
}

.linker {
	user-select: none;
	cursor: pointer;
	padding: var(--webx-padding-size);
	width: calc(100% - 2 * var(--webx-padding-size));
	overflow: hidden;
	text-overflow: ellipsis;
	word-break: keep-all;
	white-space: nowrap;
	font-weight: 100;
	font-size: 0.8em;
}

.linker:hover {
	background-color: var(--webx-shadow-color);
	border-radius: var(--webx-border-radius);
}
</style>
