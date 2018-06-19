import { getAddonIconUrl } from 'core/imageUtils';
import { fakeAddon } from 'tests/unit/amo/helpers';
import fallbackIcon from 'amo/img/icons/default-64.png';

describe('getAddonIconUrl', () => {
  const allowedIcon = 'https://addons.cdn.mozilla.net/webdev-64.png';

  it('return icon url as in fake addon', () => {
    expect(getAddonIconUrl({ ...fakeAddon, icon_url: allowedIcon })).toEqual(
      allowedIcon,
    );
  });

  it('return fallback icon in case of non allowed origin', () => {
    expect(
      getAddonIconUrl({ ...fakeAddon, icon_url: 'https://xyz.com/a.png' }),
    ).toEqual(fallbackIcon);
  });

  it('return fallback icon in case of null addon value', () => {
    expect(getAddonIconUrl(null)).toEqual(fallbackIcon);
  });
});
