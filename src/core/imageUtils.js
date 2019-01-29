import { isAllowedOrigin } from 'core/utils';
import fallbackIcon from 'amo/img/icons/default-64.png';

export function getAddonIconUrl(addon) {
  return addon && isAllowedOrigin(addon.icon_url)
    ? addon.icon_url
    : fallbackIcon;
}

export const getPreviewImage = (addon, { index = 0, full = true } = {}) => {
  const preview = addon.previews.length && addon.previews[index];
  if (preview) {
    const previewSize = full ? 'image_url' : 'thumbnail_url';
    return preview[previewSize] && isAllowedOrigin(preview[previewSize])
      ? preview[previewSize]
      : null;
  }
  return null;
};

export const getPreviewIndexBySize = (addon, size = 720) => {
  const imageIndex =
    addon.previews &&
    addon.previews.findIndex((preview) => preview.image_size[0] === size);

  return imageIndex !== -1 ? imageIndex : undefined;
};
