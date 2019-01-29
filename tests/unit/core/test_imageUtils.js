import config from 'config';

import {
  getAddonIconUrl,
  getPreviewImage,
  getPreviewIndexBySize,
} from 'core/imageUtils';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon, fakePreview } from 'tests/unit/helpers';
import fallbackIcon from 'amo/img/icons/default-64.png';

describe(__filename, () => {
  const allowedIcon = 'https://addons.cdn.mozilla.net/webdev-64.png';

  describe('getAddonIconUrl', () => {
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

  describe('getPreviewImage', () => {
    it('returns the first full image from the previews array', () => {
      const fullImage = `${config.get('amoCDN')}/full/12345.png`;
      const addon = createInternalAddon({
        previews: [
          {
            ...fakePreview,
            image_url: fullImage,
          },
          {
            ...fakePreview,
            image_url: `${config.get('amoCDN')}/image.not.used.here.png`,
          },
        ],
      });
      const image = getPreviewImage(addon);
      expect(image).toEqual(fullImage);
    });

    it('returns the full image from index 1 in the previews array', () => {
      const fullImage = `${config.get('amoCDN')}/full/12345.png`;
      const addon = createInternalAddon({
        previews: [
          {
            ...fakePreview,
            image_url: `${config.get('amoCDN')}/image.not.used.here.png`,
          },
          {
            ...fakePreview,
            image_url: fullImage,
          },
        ],
      });

      const image = getPreviewImage(addon, { index: 1 });
      expect(image).toEqual(fullImage);
    });

    it('returns the thumb image from the previews array', () => {
      const thumbImage = `${config.get('amoCDN')}/full/12345.png`;
      const addon = createInternalAddon({
        previews: [
          {
            ...fakePreview,
            thumbnail_url: thumbImage,
          },
        ],
      });

      const image = getPreviewImage(addon, { full: false });
      expect(image).toEqual(thumbImage);
    });

    it('returns null if the previews array is empty', () => {
      const addon = createInternalAddon({
        previews: [],
      });

      const image = getPreviewImage(addon);
      expect(image).toEqual(null);
    });

    it('returns null if the isAllowedOrigin returns false', () => {
      const addon = createInternalAddon({
        previews: [
          {
            ...fakePreview,
            image_url: 'http://www.example.com',
          },
        ],
      });

      const image = getPreviewImage(addon);
      expect(image).toEqual(null);
    });
  });

  describe('getPreviewIndexBySize', () => {
    it('finds the correct preview index by size', () => {
      const size = 450;
      const addon = createInternalAddon({
        previews: [
          {
            ...fakePreview,
            image_size: [400, 300],
          },
          {
            ...fakePreview,
            image_size: [size, 300],
          },
        ],
      });
      const imageIndex = getPreviewIndexBySize(addon, size);
      expect(imageIndex).toEqual(1);
    });

    it('returns undefined if the size is not found', () => {
      const size = 600;
      const addon = createInternalAddon({
        previews: [
          {
            ...fakePreview,
            image_size: [200, 100],
          },
        ],
      });
      const imageIndex = getPreviewIndexBySize(addon, size);
      expect(imageIndex).toEqual(undefined);
    });

    it('uses 720 size as the default size if not size is not provided', () => {
      const addon = createInternalAddon({
        previews: [
          {
            ...fakePreview,
            image_size: [300, 200],
          },
          {
            ...fakePreview,
            image_size: [500, 300],
          },
          {
            ...fakePreview,
            image_size: [720, 520],
          },
        ],
      });
      const imageIndex = getPreviewIndexBySize(addon);
      expect(imageIndex).toEqual(2);
    });
  });
});
