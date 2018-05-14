import { createInternalAddon } from 'core/reducers/addons';
import { getThemeData } from 'core/themeInstall';
import { fakeTheme } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  it('returns themeData from getThemeData', () => {
    const themeData = {
      accentcolor: '#000',
      author: 'carmen',
      category: 'Other',
      description: 'my theme description',
      detailURL: 'https://a.m.o/addon/my-theme',
      footer: 'https://addons.cdn.mozilla.net/footer1.jpg',
      footerURL: 'https://addons.cdn.mozilla.net/footer2.jpg',
      header: 'https://addons.cdn.mozilla.net/header1.jpg',
      headerURL: 'https://addons.cdn.mozilla.net/header2.jpg',
      iconURL: 'https://addons.cdn.mozilla.net/icon.jpg',
      id: 50,
      name: 'my theme',
      previewURL: 'https://addons.cdn.mozilla.net/preview.jpg',
      textcolor: '#fff',
      updateURL: 'https://versioncheck.m.o/themes/update-check/999876',
      version: '1.0',
    };

    const addon = createInternalAddon({
      ...fakeTheme,
      theme_data: {
        ...fakeTheme.theme_data,
        ...themeData,
      },
    });

    // Beware that getThemeData() is not always called with an AddonType
    // object. There are some spreads that combine objects.
    expect(getThemeData(addon)).toEqual(addon.themeData);

    // Make sure an unknown key is not added to the output.
    expect(getThemeData({ ...themeData, badKey: true })).toEqual(themeData);
  });
});
