// Addon States.
export const DISABLED = 'DISABLED';
export const DISABLING = 'DISABLING';
export const DOWNLOADING = 'DOWNLOADING';
export const ENABLED = 'ENABLED';
export const ENABLING = 'ENABLING';
export const ERROR = 'ERROR';
export const INSTALLED = 'INSTALLED';
export const INSTALLING = 'INSTALLING';
export const UNINSTALLED = 'UNINSTALLED';
export const UNINSTALLING = 'UNINSTALLING';
export const UNKNOWN = 'UNKNOWN';
export const validInstallStates = [
  DISABLED,
  DISABLING,
  ENABLED,
  ENABLING,
  DOWNLOADING,
  ENABLED,
  ERROR,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
];

// Add-on error states.
export const DOWNLOAD_FAILED = 'DOWNLOAD_FAILED';
export const INSTALL_FAILED = 'INSTALL_FAILED';

// Unrecoverable errors.
export const FATAL_INSTALL_ERROR = 'FATAL_INSTALL_ERROR';
export const FATAL_UNINSTALL_ERROR = 'FATAL_UNINSTALL_ERROR';
export const FATAL_ERROR = 'FATAL_ERROR';

// Add-on types.
export const ADDON_TYPE_EXTENSION = 'extension';
export const ADDON_TYPE_THEME = 'persona';
export const validAddonTypes = [
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
];
// Mapping of the add-on types we show in URLs, etc. and what they map
// to in the API (and how they're represented internally in the app).
//
// Examples:
// * '/extensions/' -> 'extension'
// * '/themes/' -> 'persona'
export const API_ADDON_TYPES_MAPPING = {
  extensions: ADDON_TYPE_EXTENSION,
  themes: ADDON_TYPE_THEME,
};
export const VISIBLE_ADDON_TYPES_MAPPING = Object.keys(API_ADDON_TYPES_MAPPING)
  .reduce((object, key) => ({
    ...object,
    [API_ADDON_TYPES_MAPPING[key]]: key,
  }), {});

// Tracking add-on types
export const TRACKING_TYPE_EXTENSION = 'addon';
export const TRACKING_TYPE_THEME = 'theme';
export const TRACKING_TYPE_INVALID = 'invalid';

// Add-on Search Sort Values
export const SEARCH_SORT_POPULAR = 'hotness';
export const SEARCH_SORT_TOP_RATED = 'rating';

// Action types.
export const CATEGORIES_GET = 'CATEGORIES_GET';
export const CATEGORIES_LOAD = 'CATEGORIES_LOAD';
export const CATEGORIES_FAILED = 'CATEGORIES_FAILED';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const ENTITIES_LOADED = 'ENTITIES_LOADED';
export const FEATURED_GET = 'FEATURED_GET';
export const FEATURED_LOADED = 'FEATURED_LOADED';
export const LANDING_GET = 'LANDING_GET';
export const LANDING_LOADED = 'LANDING_LOADED';
export const LANDING_FAILED = 'LANDING_FAILED';
export const LOG_OUT_USER = 'LOG_OUT_USER';
export const SEARCH_FAILED = 'SEARCH_FAILED';
export const SEARCH_LOADED = 'SEARCH_LOADED';
export const SEARCH_STARTED = 'SEARCH_STARTED';
export const SET_CLIENT_APP = 'SET_CLIENT_APP';
export const SET_CURRENT_USER = 'SET_CURRENT_USER';
export const SET_ERROR = 'SET_ERROR';
export const SET_JWT = 'SET_JWT';
export const SET_LANG = 'SET_LANG';

// InfoDialog action types.
export const CLOSE_INFO = 'CLOSE_INFO';
export const SHOW_INFO = 'SHOW_INFO';

// Theme preview actions.
export const THEME_INSTALL = 'InstallBrowserTheme';
export const THEME_PREVIEW = 'PreviewBrowserTheme';
export const THEME_RESET_PREVIEW = 'ResetBrowserThemePreview';
export const validThemeActions = [
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
];

export const INSTALL_EVENT_LIST = [
  'onDownloadStarted',
  'onDownloadProgress',
  'onDownloadEnded',
  'onDownloadCancelled',
  'onDownloadFailed',
  'onInstallStarted',
  'onInstallProgress',
  'onInstallEnded',
  'onInstallCancelled',
  'onInstallFailed',
];

// Install Types
export const INSTALL_STATE = 'INSTALL_STATE';
export const START_DOWNLOAD = 'START_DOWNLOAD';
export const DOWNLOAD_PROGRESS = 'DOWNLOAD_PROGRESS';
export const INSTALL_COMPLETE = 'INSTALL_COMPLETE';
export const UNINSTALL_COMPLETE = 'UNINSTALL_COMPLETE';
export const INSTALL_ERROR = 'INSTALL_ERROR';

export const acceptedInstallTypes = [
  INSTALL_STATE,
  START_DOWNLOAD,
  DOWNLOAD_PROGRESS,
  INSTALL_COMPLETE,
  UNINSTALL_COMPLETE,
  INSTALL_ERROR,
];

// Tracking categories.
export const INSTALL_CATEGORY = 'AMO Addon / Theme Installs';
export const UNINSTALL_CATEGORY = 'AMO Addon / Theme Uninstalls';
export const CLICK_CATEGORY = 'AMO Addon / Theme Clicks';

// Error used to know that the setEnable method on addon is
// not available.
export const SET_ENABLE_NOT_AVAILABLE = 'SET_ENABLE_NOT_AVAILABLE';

// Add-on statuses for mozAddonManager events.
export const GLOBAL_EVENT_STATUS_MAP = {
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
// they will be fired by addons and themes.
export const GLOBAL_EVENTS = Object.keys(GLOBAL_EVENT_STATUS_MAP);
