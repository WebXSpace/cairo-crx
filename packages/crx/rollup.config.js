import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

import copy from 'rollup-plugin-copy';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import inject from '@rollup/plugin-inject';

const isProduction = process.env.NODE_ENV == 'production' ? true : false;

let copyTargets;

if (isProduction) {
	copyTargets = {
		targets: [
			{ src: 'manifest.json', dest: 'dist' },
			{ src: '../crxui/dist/*', dest: 'dist/popup' },
			{ src: './src/assets', dest: 'dist' },
		],
	};
} else {
	copyTargets = {
		targets: [
			{ src: 'manifest-dev.json', dest: 'dist', rename: 'manifest.json' },
			{ src: '../crxui/dist/*', dest: 'dist/popup' },
			{ src: './src/assets', dest: 'dist' },
		],
	};
}

export default [
	{
		input: 'src/background.ts',
		output: {
			dir: 'dist',
			format: 'esm',
		},
		plugins: [
			commonjs(),
			nodePolyfills(),
			typescript(),
			nodeResolve({ browser: true, preferBuiltins: false }),
			replace({
				preventAssignment: true,
				'global.WebSocket': 'self.WebSocket',
				'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
			}),
			inject({ Buffer: ['Buffer', 'Buffer'] }),
		],
	},
	{
		input: 'src/inject.ts',
		output: {
			dir: 'dist',
			format: 'esm',
			intro: 'const ENVIRONMENT = "production";',
		},
		plugins: [
			commonjs(),
			nodePolyfills(),
			typescript(),
			nodeResolve({ browser: true, preferBuiltins: false }),
			copy(copyTargets),
		],
	},
	{
		input: 'src/etherum.ts',
		output: {
			dir: 'dist',
			format: 'esm',
		},
		plugins: [
			commonjs(),
			nodePolyfills(),
			typescript(),
			nodeResolve({ browser: true, preferBuiltins: false }),
		],
	},
];
