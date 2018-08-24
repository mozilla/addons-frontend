import React from 'react';

import { withConsole } from '@storybook/addon-console';
import { addDecorator, configure, setAddon } from '@storybook/react';
import { withInfo, setDefaults as setAddonInfoDefaults } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { setOptions } from '@storybook/addon-options';


// Override withInfo options.
setAddonInfoDefaults({
  header: false, // Hides header display of name and description.
  // inline: true, // Shows everything on the same page.
});


// Override some global-y setup options.
// See https://www.npmjs.com/package/@storybook/addon-options.
setOptions({
  name: 'Mozilla Addons frontend',
  url: 'https://github.com/mozilla/addons-frontend',
});


// Global Decorators.
addDecorator(withKnobs)
addDecorator((story, context) => withConsole()(story)(context));


function loadStories() {
  require('../stories');
}

configure(loadStories, module);
