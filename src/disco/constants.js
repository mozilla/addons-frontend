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

// Keys for extensions and theme data in the discovery pane JSON blob.
export const DISCO_DATA_THEME = 'theme';
export const DISCO_DATA_EXTENSION = 'extension';
export const DISCO_DATA_UNKNOWN = 'unknown';
// Built-in extensions and themes to ignore.
export const DISCO_DATA_GUID_IGNORE_LIST = [
  '{972ce4c6-7e08-4474-a285-3208198ce6fd}', // Default theme.
  'e10srollout@mozilla.org', // e10s
  'firefox@getpocket.com', // Pocket
  'loop@mozilla.org', // Firefox Hello
];
