import { addons } from '@storybook/addons';
import {
  addDecorator,
  addParameters,
  configure,
  setAddon,
} from '@storybook/react';
import { initializeRTL } from 'storybook-addon-rtl';
import { create } from '@storybook/theming/create';
import chaptersAddon, {
  setDefaults as setAddonChaptersDefaults,
} from 'react-storybook-addon-chapters';

import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Override some global-y setup options.
addParameters({
  options: {
    theme: create({
      brandTitle: 'Mozilla Addons frontend',
      brandUrl: 'https://github.com/mozilla/addons-frontend',
    }),
    showPanel: true,
  },
});

setAddonChaptersDefaults({
  sectionOptions: {
    allowPropTablesToggling: false,
    allowSourceToggling: false,
    showSource: false,
    useTheme: false,
  },
});
setAddon(chaptersAddon);

initializeRTL();
