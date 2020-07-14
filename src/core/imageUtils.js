import { isAllowedOrigin } from 'core/utils';
import fallbackIcon from 'amo/img/icons/default-64.png';

export function getAddonIconUrl(addon) {
  return addon && isAllowedOrigin(addon.icon_url)
    ? addon.icon_url
    : fallbackIcon;
}

export const getPreviewImage = (
  addon,
  { full = true, useStandardSize = true } = {},
) => {
  if (!addon.previews.length) {
    return null;
  }

  let imageIndex = 0;

  if (useStandardSize) {
    if (!full) {
      throw new Error("Currently there is no 'standard' thumbnail size");
    }

    // 720 is now the standard width for previews.
    const width = 720;
    imageIndex =
      // The preview.image_size[0] is the image width.
      addon.previews.findIndex((preview) => preview.image_size[0] === width);
  }

  // This is a fallback for older themes that do not have this size generated.
  if (imageIndex < 0) {
    imageIndex = 0;
  }

  const preview = addon.previews[imageIndex];

  const previewSize = full ? 'image_url' : 'thumbnail_url';
  return preview[previewSize] && isAllowedOrigin(preview[previewSize])
    ? preview[previewSize]
    : null;
};
