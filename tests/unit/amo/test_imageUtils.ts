import { getAddonIconUrl, getPreviewImage } from 'amo/imageUtils';
import { createInternalAddonWithLang, fakeAddon, fakePreview } from 'tests/unit/helpers';
import fallbackIcon from 'amo/img/icons/default.svg';

describe(__filename, () => {
  const allowedIcon = 'https://addons.mozilla.org/webdev-64.png';
  describe('getAddonIconUrl', () => {
    it('return icon url as in fake addon', () => {
      expect(getAddonIconUrl({ ...fakeAddon,
        icon_url: allowedIcon,
      })).toEqual(allowedIcon);
    });
    it('return fallback icon in case of null addon value', () => {
      expect(getAddonIconUrl(null)).toEqual(fallbackIcon);
    });
  });
  describe('getPreviewImage', () => {
    it('returns the first full image from the previews array', () => {
      const fullImage = `https://addons.mozilla.org/full/12345.png`;
      const addon = createInternalAddonWithLang({
        previews: [{ ...fakePreview,
          image_url: fullImage,
        }, { ...fakePreview,
          image_url: `https://addons.mozilla.org/image.not.used.here.png`,
        }],
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
        previews: [{ ...fakePreview,
          image_size: [300, 200],
        }, { ...fakePreview,
          image_size: [500, 300],
        }, { ...fakePreview,
          image_size: [720, 520],
          image_url: image720,
        }],
      });
      const image = getPreviewImage(addon);
      expect(image).toEqual(image720);
    });
    it('returns the thumb image from the previews array when full is false', () => {
      const thumbImage = `https://addons.mozilla.org/thumb/12345.png`;
      const addon = createInternalAddonWithLang({
        previews: [{ ...fakePreview,
          image_size: [500, 300],
        }, { ...fakePreview,
          image_size: [720, 520],
          thumbnail_url: thumbImage,
        }],
      });
      const image = getPreviewImage(addon, {
        full: false,
      });
      expect(image).toEqual(thumbImage);
    });
    it('uses the first preview image when the 720 size is not present', () => {
      const image300 = `https://addons.mozilla.org/full/12345.png`;
      const addon = createInternalAddonWithLang({
        previews: [{ ...fakePreview,
          image_size: [300, 200],
          image_url: image300,
        }, { ...fakePreview,
          image_size: [500, 300],
        }],
      });
      const image = getPreviewImage(addon);
      expect(image).toEqual(image300);
    });
  });
});