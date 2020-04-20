import { configure, setAddon, addDecorator } from '@storybook/react';
import { setDefaults } from '@storybook/addon-info';
import { withOptions } from '@storybook/addon-options';
import { initializeRTL } from 'storybook-addon-rtl';
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
addDecorator(
  withOptions({
    name: 'Mozilla Addons frontend',
    url: 'https://github.com/mozilla/addons-frontend',
    // Hide empty panel for now.
    showAddonPanel: true,
  }),
);

setAddonChaptersDefaults({
  sectionOptions: {
    allowPropTablesToggling: false,
    allowSourceToggling: false,
    showSource: false,
    useTheme: false,
  },
});
setAddon(chaptersAddon);

function loadStories() {
  /* eslint-disable global-require */
  require('../index');
}

initializeRTL();

configure(loadStories, module);
