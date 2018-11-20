// import url from 'url';

// import config from 'config';
// import UAParser from 'ua-parser-js';

// import {
//   ADDON_TYPE_COMPLETE_THEME,
//   ADDON_TYPE_DICT,
//   ADDON_TYPE_EXTENSION,
//   ADDON_TYPE_LANG,
//   ADDON_TYPE_OPENSEARCH,
//   ADDON_TYPE_STATIC_THEME,
//   ADDON_TYPE_THEME,
//   ADDON_TYPE_THEMES_FILTER,
//   CATEGORY_COLORS,
//   CLIENT_APP_ANDROID,
//   CLIENT_APP_FIREFOX,
//   OS_ALL,
//   OS_ANDROID,
//   OS_LINUX,
//   OS_MAC,
//   OS_WINDOWS,
//   validAddonTypes,
// } from 'core/constants';
import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
// import { createInternalAddon } from 'core/reducers/addons';
// import { createPlatformFiles } from 'core/reducers/versions';
import {
  // createFakeHistory,
  // createFakeLocation,
  // fakeAddon,
  fakeI18n,
  // fakePlatformFile,
  // fakeVersion,
  // unexpectedSuccess,
  // userAgents,
  // userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getLocalizedTextWithLinkParts', () => {
    it('returns a descriptive object', () => {
      const parts = getLocalizedTextWithLinkParts({
        i18n: fakeI18n(),
        text: 'Explore more %(linkStart)s stuff %(linkEnd)s here.',
      });

      expect(parts).toHaveProperty('beforeLinkText');
      expect(parts.beforeLinkText).toEqual('Explore more ');

      expect(parts).toHaveProperty('innerLinkText');
      expect(parts.innerLinkText).toEqual(' stuff ');

      expect(parts).toHaveProperty('afterLinkText');
      expect(parts.afterLinkText).toEqual(' here.');
    });
  });
});
