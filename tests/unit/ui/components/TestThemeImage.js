import * as React from 'react';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import ThemeImage, { ThemeImageBase } from 'ui/components/ThemeImage';
import { fakeAddon, fakeTheme } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallowUntilTarget(
      <ThemeImage i18n={fakeI18n()} {...props} />,
      ThemeImageBase,
    );
  };

  it('renders nothing when add-on is null', () => {
    const root = render({ addon: null });

    expect(root.find('.ThemeImage')).toHaveLength(0);
  });

  it('renders nothing when add-on is not a theme', () => {
    const root = render({
      addon: createInternalAddon({ ...fakeAddon, type: ADDON_TYPE_EXTENSION }),
    });

    expect(root.find('.ThemeImage')).toHaveLength(0);
  });

  it('renders a theme image when add-on is a lightweight theme', () => {
    const addon = createInternalAddon({ ...fakeTheme, type: ADDON_TYPE_THEME });
    const root = render({ addon });

    expect(root.find('.ThemeImage')).toHaveLength(1);
    expect(root.find('.ThemeImage')).not.toHaveClassName(
      'ThemeImage--rounded-corners',
    );
    expect(root.find('.ThemeImage-image')).toHaveLength(1);
    expect(root.find('.ThemeImage-image')).toHaveProp(
      'alt',
      `Preview of ${addon.name}`,
    );
    expect(root.find('.ThemeImage-image')).toHaveProp(
      'src',
      addon.previews[0].image_url,
    );
  });

  it('renders a theme image when add-on is a static theme', () => {
    const addon = createInternalAddon({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
    });
    const root = render({ addon });

    expect(root.find('.ThemeImage')).toHaveLength(1);
    expect(root.find('.ThemeImage-image')).toHaveLength(1);
    expect(root.find('.ThemeImage-image')).toHaveProp(
      'alt',
      `Preview of ${addon.name}`,
    );
    expect(root.find('.ThemeImage-image')).toHaveProp(
      'src',
      addon.previews[0].image_url,
    );
  });

  it('renders a theme image with the preview URL of a lightweight theme', () => {
    const previewURL = 'some-preview-url';
    const addon = createInternalAddon({
      ...fakeTheme,
      type: ADDON_TYPE_THEME,
      previews: [],
      theme_data: {
        ...fakeTheme.theme_data,
        previewURL,
      },
    });
    const root = render({ addon });

    expect(root.find('.ThemeImage-image')).toHaveProp('src', previewURL);
  });

  it('renders a theme image with rounded corners', () => {
    const addon = createInternalAddon({ ...fakeTheme, type: ADDON_TYPE_THEME });
    const root = render({ addon, roundedCorners: true });

    expect(root.find('.ThemeImage')).toHaveLength(1);
    expect(root.find('.ThemeImage')).toHaveClassName(
      'ThemeImage--rounded-corners',
    );
  });
});
