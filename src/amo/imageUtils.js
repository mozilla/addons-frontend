import fallbackIcon from 'amo/img/icons/default.svg';

export function getAddonIconUrl(addon) {
  return addon ? addon.icon_url : fallbackIcon;
}

export const getPreviewImage = (addon, { full = true } = {}) => {
  if (!addon.previews.length) {
    return null;
  }

  // 720 is now the standard width for previews. The preview.w is the image width.
  let imageIndex = addon.previews.findIndex((preview) => preview.w === 720);

  // This is a fallback for older themes that do not have this size generated.
  if (imageIndex < 0) {
    imageIndex = 0;
  }

  const preview = addon.previews[imageIndex];

  const previewSize = full ? 'src' : 'thumbnail_src';
  return preview[previewSize];
};
