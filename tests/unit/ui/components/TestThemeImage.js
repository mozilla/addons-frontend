import * as React from 'react';
import config from 'config';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import ThemeImage, { ThemeImageBase } from 'ui/components/ThemeImage';
import {
  fakeAddon,
  fakeI18n,
  fakePreview,
  fakeTheme,
  shallowUntilTarget,
} from 'tests/unit/helpers';

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

  it('passes useStandardSize to display a preview with 720 width', () => {
    const fullImage600 = `${config.get('amoCDN')}/full/600.png`;
    const fullImage720 = `${config.get('amoCDN')}/full/720.png`;
    const addon = createInternalAddon({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
      previews: [
        {
          ...fakePreview,
          image_size: [600, 500],
          image_url: fullImage600,
        },
        {
          ...fakePreview,
          image_size: [720, 500],
          image_url: fullImage720,
        },
      ],
    });
    const root = render({ addon, useStandardSize: true });

    expect(root.find('.ThemeImage-image')).toHaveProp('src', fullImage720);
  });

  it('passes index when it wants to specify a certain preview image', () => {
    const fullImage600 = `${config.get('amoCDN')}/full/600.png`;
    const addon = createInternalAddon({
      ...fakeTheme,
      type: ADDON_TYPE_STATIC_THEME,
      previews: [
        {
          ...fakePreview,
          image_size: [500, 500],
        },
        {
          ...fakePreview,
          image_size: [600, 500],
          image_url: fullImage600,
        },
        {
          ...fakePreview,
          image_size: [720, 500],
        },
      ],
    });
    const root = render({ addon, index: 1 });

    expect(root.find('.ThemeImage-image')).toHaveProp('src', fullImage600);
  });
});
