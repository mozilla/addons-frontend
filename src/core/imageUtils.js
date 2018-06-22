import { isAllowedOrigin } from 'core/utils';
import fallbackIcon from 'amo/img/icons/default-64.png';

export function getAddonIconUrl(addon) {
  return addon && isAllowedOrigin(addon.icon_url)
    ? addon.icon_url
    : fallbackIcon;
}
