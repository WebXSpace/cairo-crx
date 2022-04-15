import { createApp } from 'vue';
import App from './App.vue';

import router from './router';
import 'virtual:svg-icons-register';

import 'animate.css';

import { webxui } from '@webxspace/webxui';
import '@webxspace/webxui/dist/style.css';
import './assets/style.css';

import Echart from './echart';

createApp(App).component('v-chart', Echart).use(webxui).use(router).mount('#app');
