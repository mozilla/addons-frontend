import config from 'config';

import { getAddonIconUrl, getPreviewImage } from 'amo/imageUtils';
import {
  createInternalAddonWithLang,
  fakeAddon,
  fakePreview,
} from 'tests/unit/helpers';
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
      const addon = createInternalAddonWithLang({
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

    it('returns null if the previews array is empty', () => {
      const addon = createInternalAddonWithLang({
        previews: [],
      });

      const image = getPreviewImage(addon);
      expect(image).toEqual(null);
    });

    it('returns null if the isAllowedOrigin returns false', () => {
      const addon = createInternalAddonWithLang({
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

    it('uses the standard preview size (720)', () => {
      const image720 = `${config.get('amoCDN')}/full/12345.png`;
      const addon = createInternalAddonWithLang({
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
            image_url: image720,
          },
        ],
      });

      const image = getPreviewImage(addon);
      expect(image).toEqual(image720);
    });

    it('returns the thumb image from the previews array when full is false', () => {
      const thumbImage = `${config.get('amoCDN')}/thumb/12345.png`;
      const addon = createInternalAddonWithLang({
        previews: [
          {
            ...fakePreview,
            image_size: [500, 300],
          },
          {
            ...fakePreview,
            image_size: [720, 520],
            thumbnail_url: thumbImage,
          },
        ],
      });

      const image = getPreviewImage(addon, { full: false });
      expect(image).toEqual(thumbImage);
    });

    it('uses the first preview image when the 720 size is not present', () => {
      const image300 = `${config.get('amoCDN')}/full/12345.png`;
      const addon = createInternalAddonWithLang({
        previews: [
          {
            ...fakePreview,
            image_size: [300, 200],
            image_url: image300,
          },
          {
            ...fakePreview,
            image_size: [500, 300],
          },
        ],
      });

      const image = getPreviewImage(addon);
      expect(image).toEqual(image300);
    });
  });
});
