import fallbackIcon from 'amo/img/icons/default.svg';

//
// returns icon url from icons objects,
// or returns icon_url value if icons does not exists
//
// fallback icon will be returned if the addon has no icon.
//
// iconSize values are 32 | 64 | 128
export function getAddonIconUrl(addon, size) {
  const iconSizes = [32, 64, 128];
  const iconSizeIsNotValid = size && !iconSizes.includes(size);

  if (iconSizeIsNotValid) {
    throw new Error(`size must be one of: ${iconSizes.toString()}`);
  }

  const defaultIconSize = iconSizes[1];

  const iconFromIcons = addon?.icons?.[size] || addon?.icons?.[defaultIconSize];

  return iconFromIcons || addon?.icon_url || fallbackIcon;
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
  return preview[previewSize] || null;
};
