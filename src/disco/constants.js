import {
  DISABLED,
  DISABLING,
  ENABLED,
  ENABLING,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';

export const INSTALL_CATEGORY = 'AMO Addon / Theme Installs';
export const UNINSTALL_CATEGORY = 'AMO Addon / Theme Uninstalls';
export const CLICK_CATEGORY = 'AMO Addon / Theme Clicks';
export const VIDEO_CATEGORY = 'Discovery Video';
export const NAVIGATION_CATEGORY = 'Discovery Navigation';

export const globalEventStatusMap = {
  onDisabled: DISABLED,
  onEnabled: ENABLED,
  onInstalling: INSTALLING,
  onInstalled: INSTALLED,
  onUninstalling: UNINSTALLING,
  onUninstalled: UNINSTALLED,
  onEnabling: ENABLING,
  onDisabling: DISABLING,
};

// The events here are set directly on mozAddonManager
// they will be fired by addons and themes that aren't
// necessarily in the disco pane.
export const globalEvents = Object.keys(globalEventStatusMap);

export const SHOW_INFO = 'SHOW_INFO';
export const CLOSE_INFO = 'CLOSE_INFO';

// Error used to know that the setEnable method on addon is
// not available.
export const SET_ENABLE_NOT_AVAILABLE = 'SET_ENABLE_NOT_AVAILABLE';
