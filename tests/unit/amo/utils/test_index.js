import { getCanonicalURL, shouldShowThemes } from 'amo/utils';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getCanonicalURL', () => {
    it(`returns an absolute canonical URL`, () => {
      const locationPathname = '/path/name';
      const baseURL = 'https://example.org';
      const _config = getFakeConfig({ baseURL });

      expect(getCanonicalURL({ _config, locationPathname })).toEqual(
        `${baseURL}${locationPathname}`,
      );
    });
  });

  describe('shouldShowThemes', () => {
    it('returns true when clientApp is Android and enableFeatureStaticThemesForAndroid is true', () => {
      const _config = getFakeConfig({
        enableFeatureStaticThemesForAndroid: true,
      });
      const clientApp = CLIENT_APP_ANDROID;

      expect(shouldShowThemes({ _config, clientApp })).toEqual(true);
    });

    it('returns false when clientApp is Android and enableFeatureStaticThemesForAndroid is false', () => {
      const _config = getFakeConfig({
        enableFeatureStaticThemesForAndroid: false,
      });
      const clientApp = CLIENT_APP_ANDROID;

      expect(shouldShowThemes({ _config, clientApp })).toEqual(false);
    });

    it('returns true when clientApp is not Android', () => {
      const _config = getFakeConfig({
        enableFeatureStaticThemesForAndroid: false,
      });
      const clientApp = CLIENT_APP_FIREFOX;

      expect(shouldShowThemes({ _config, clientApp })).toEqual(true);
    });
  });
});
