import { createRouter, createWebHashHistory } from 'vue-router';

import { QRCode, AddChain, SwitchChain, Options } from './crxui';

const routes = [
	{
		path: '/',
		name: 'options',
		component: Options,
		children: [],
	},
	{
		path: '/qrcode',
		name: 'qrcode',
		component: QRCode,
		children: [],
	},
	{
		path: '/addchain',
		name: 'addchain',
		component: AddChain,
		children: [],
	},
	{
		path: '/switchchain',
		name: 'switchchain',
		component: SwitchChain,
		children: [],
	},
];

export default createRouter({
	routes,
	history: createWebHashHistory(),
});
