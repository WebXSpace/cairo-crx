import { resolve, join, parse } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import replace from '@rollup/plugin-replace';

// https://vitejs.dev/config/
export default defineConfig({
	css: { preprocessorOptions: { css: { charset: false } } },
	root: resolve(__dirname),
	publicDir: resolve(__dirname, 'public'),
	plugins: [
		vue(),
		createSvgIconsPlugin({
			iconDirs: [resolve(__dirname, 'src/assets/svg')],

			symbolId: 'icon-[dir]-[name]',
		}),
	],
	build: {
		outDir: resolve(__dirname, '../crx/dist/popup'),
		sourcemap: 'hidden',
	},
	server: {
		host: '0.0.0.0',
		port: 4000,
	},
	base: '/popup',
	define: {
		__INTLIFY_PROD_DEVTOOLS__: false,
	},
});
