import React from 'react';
import { addDecorator, configure, setAddon } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';

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
