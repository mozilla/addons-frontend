import { addons } from '@storybook/addons';
import {
  addDecorator,
  addParameters,
  configure,
  setAddon,
} from '@storybook/react';
import { setDefaults } from '@storybook/addon-info';
import { withOptions } from '@storybook/addon-options';
import { initializeRTL } from 'storybook-addon-rtl';
import { create } from '@storybook/theming/create';
import chaptersAddon, {
  setDefaults as setAddonChaptersDefaults,
} from 'react-storybook-addon-chapters';

import 'core-js/stable';
import 'regenerator-runtime/runtime';

// addon-info default settings.
setDefaults({
  header: false,
  inline: true,
  source: false,
  styles: (stylesheet) => ({
    ...stylesheet,
    infoBody: {
      fontSize: '12px',
    },
  }),
});

// Override some global-y setup options.
// See: https://www.npmjs.com/package/@storybook/addon-options
addParameters({
  options: {
    theme: create({
      brandTitle: 'Mozilla Addons frontend',
      brandUrl: 'https://github.com/mozilla/addons-frontend',
      // Hide empty panel for now.
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
