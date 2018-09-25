import { configure, setAddon } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';
import chaptersAddon, { setDefaults } from 'react-storybook-addon-chapters';
import infoAddon, {
  setDefaults as setAddonInfoDefaults,
} from '@storybook/addon-info';

// TBD: overrides chapters defaults. Do we want this?
setDefaults({
  sectionOptions: {
    allowPropTablesToggling: false,
    allowSourceToggling: false,
    showSource: false,
    useTheme: false,
  },
});

setAddon(chaptersAddon);

setAddonInfoDefaults({
  header: false,
  inline: true,
  source: false,
  styles: {
    infoBody: {
      fontSize: '12px',
    },
  },
});

setAddon(infoAddon);

// Override some global-y setup options.
// See https://www.npmjs.com/package/@storybook/addon-options.
setOptions({
  name: 'Mozilla Addons frontend',
  url: 'https://github.com/mozilla/addons-frontend',
  // Hide empty panel for now.
  showAddonPanel: false,
});

function loadStories() {
  /* eslint-disable global-require */
  require('./../index');
}

configure(loadStories, module);
