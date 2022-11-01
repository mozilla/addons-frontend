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
    it('return requested icon size url', () => {
      const addonIconUrl = getAddonIconUrl(
        { icons: { 32: iconsUrlsExample.regular } },

        32,
      );

      expect(addonIconUrl).toEqual(iconsUrlsExample.regular);
    });

    it('return default icon size url if no size is requested', () => {
      const addonIcon = getAddonIconUrl({
        icons: { 64: iconsUrlsExample.regular },
      });

      expect(addonIcon).toEqual(iconsUrlsExample.regular);
    });

    it('return default icon size url if requested size url is undefined', () => {
      const addonIcon = getAddonIconUrl(
        {
          icons: { 64: iconsUrlsExample.regular },
        },

        32,
      );

      expect(addonIcon).toEqual(iconsUrlsExample.regular);
    });

    it('return icon_url if default icon size url is undefined', () => {
      const addonIconUrl = getAddonIconUrl({
        icon_url: iconsUrlsExample.regular,
      });

      expect(addonIconUrl).toEqual(iconsUrlsExample.regular);
    });

    it('return fallback icon url if icon_url is undefined', () => {
      const addonIconUrl = getAddonIconUrl({
        icons: { 32: iconsUrlsExample.small },
      });

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
