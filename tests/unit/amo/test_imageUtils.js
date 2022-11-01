import { getAddonIconUrl, getPreviewImage } from 'amo/imageUtils';
import { createInternalAddonWithLang, fakePreview } from 'tests/unit/helpers';
import fallbackIcon from 'amo/img/icons/default.svg';

const iconsUrlsExample = {
  small: 'https://addons.mozilla.org/get-icon-exampele-sml-32.png',
  regular: 'https://addons.mozilla.org/get-icon-example-reg-64.png',
  large: 'https://addons.mozilla.org/get-icon-example-lrg-128.png',
};

describe(__filename, () => {
  describe('getAddonIconUrl', () => {
    it('return default icon size if requested size is invalid', () => {
      const addonIconUrl = getAddonIconUrl(
        { icons: { 64: iconsUrlsExample.regular } },

        25,
      );

      expect(addonIconUrl).toEqual(iconsUrlsExample.regular);
    });

    it('return icon urls from icons object', () => {
      const addonIcon = getAddonIconUrl({
        icons: { 64: iconsUrlsExample.regular },
      });

      expect(addonIcon).toEqual(iconsUrlsExample.regular);
    });

    it('return small(32px) url icon', () => {
      const smallIconUrl = iconsUrlsExample.small;

      const addonIconUrl = getAddonIconUrl(
        {
          icons: { 32: smallIconUrl },
        },

        32,
      );

      expect(addonIconUrl).toEqual(smallIconUrl);
    });

    it('return regular(64px) icon url', () => {
      const regularIconUrl = iconsUrlsExample.regular;

      const addonIcon = getAddonIconUrl({
        icons: { 64: regularIconUrl },
      });

      expect(addonIcon).toEqual(regularIconUrl);
    });

    it('return large(128px) icon url', () => {
      const largeIconUrl = iconsUrlsExample.large;

      const addonIconUrl = getAddonIconUrl(
        {
          icons: { 64: largeIconUrl },
        },

        64,
      );

      expect(addonIconUrl).toEqual(largeIconUrl);
    });

    it('return icon_url if icons is undefined', () => {
      const addonIconUrl = getAddonIconUrl(
        {
          icon_url: iconsUrlsExample.regular,
        },

        64,
      );

      expect(addonIconUrl).toEqual(iconsUrlsExample.regular);
    });

    it('return default icon size if requested icon size(large, small) is undefined', () => {
      const addonIconUrl = getAddonIconUrl(
        {
          icons: { 64: iconsUrlsExample.regular },
        },

        64,
      );

      expect(addonIconUrl).toEqual(iconsUrlsExample.regular);
    });

    it('return fallback icon if requested icon size is undefined', () => {
      const addonIconUrl = getAddonIconUrl(
        { icons: { 32: iconsUrlsExample.small } },

        64,
      );

      expect(addonIconUrl).toEqual(fallbackIcon);
    });

    it('return fallback icon in case of null addon value', () => {
      expect(getAddonIconUrl(null)).toEqual(fallbackIcon);
    });
  });

  describe('getPreviewImage', () => {
    it('returns the first full image from the previews array', () => {
      const fullImage = `https://addons.mozilla.org/full/12345.png`;
      const addon = createInternalAddonWithLang({
        previews: [
          {
            ...fakePreview,
            image_url: fullImage,
          },
          {
            ...fakePreview,
            image_url: `https://addons.mozilla.org/image.not.used.here.png`,
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

    it('uses the standard preview size (720)', () => {
      const image720 = `https://addons.mozilla.org/full/12345.png`;
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
      const thumbImage = `https://addons.mozilla.org/thumb/12345.png`;
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
      const image300 = `https://addons.mozilla.org/full/12345.png`;
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
