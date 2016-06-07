// Addon States.
export const DOWNLOADING = 'downloading';
export const ERROR = 'error';
export const INSTALLED = 'installed';
export const INSTALLING = 'installing';
export const UNINSTALLED = 'uninstalled';
export const UNINSTALLING = 'uninstalling';
export const UNKNOWN = 'unknown';
export const validInstallStates = [
  DOWNLOADING,
  ERROR,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
];

// Add-on types.
export const API_THEME_TYPE = 'persona';
export const EXTENSION_TYPE = 'extension';
export const THEME_TYPE = 'theme';
// These types are not used.
// export const DICT_TYPE = 'dictionary';
// export const SEARCH_TYPE = 'search';
// export const LPAPP_TYPE = 'language';
// export const PERSONA_TYPE = 'persona';
export const validAddonTypes = [
  EXTENSION_TYPE,
  THEME_TYPE,
];

// Theme preview actions.
export const THEME_INSTALL = 'InstallBrowserTheme';
export const THEME_PREVIEW = 'PreviewBrowserTheme';
export const THEME_RESET_PREVIEW = 'ResetBrowserThemePreview';
export const validThemeActions = [
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
];

export const installEventList = [
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

export const INSTALL_CATEGORY = 'AMO Addon / Theme Installs';
export const UNINSTALL_CATEGORY = 'AMO Addon / Theme Uninstalls';
