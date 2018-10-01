import { configure, setAddon } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';
import chaptersAddon, { setDefaults } from 'react-storybook-addon-chapters';

// TBD: overrides chapters defaults. Do We want this?
setDefaults({
	sectionOptions: {
		showSource: false,
		allowSourceToggling: false,
		showPropTables: false,
		allowPropTablesToggling: false,
	},
});

setAddon(chaptersAddon);

// Override some global-y setup options.
// See https://www.npmjs.com/package/@storybook/addon-options.
setOptions({
	name: 'Mozilla Addons frontend',
	url: 'https://github.com/mozilla/addons-frontend',
});

function loadStories() {
	/* eslint-disable global-require */
	require('./../index');
}

configure(loadStories, module);
