import { createI18n } from '@webxspace/webxui';

import en from './en';
import zh from './zh';

createI18n({
	default: 'en',
	messages: {
		en,
		zh,
	},
});
