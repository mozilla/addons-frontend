// Addon States.
export const DOWNLOADING = 'DOWNLOADING';
export const ERROR = 'ERROR';
export const INSTALLED = 'INSTALLED';
export const INSTALLING = 'INSTALLING';
export const UNINSTALLED = 'UNINSTALLED';
export const UNINSTALLING = 'UNINSTALLING';
export const UNKNOWN = 'UNKNOWN';
// Theme states
export const DISABLED = 'DISABLED';
export const ENABLED = 'ENABLED';

export const validInstallStates = [
  DISABLED,
  ENABLED,
  DOWNLOADING,
  ENABLED,
  ERROR,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
];

export const DOWNLOAD_FAILED = 'DOWNLOAD_FAILED';
export const INSTALL_FAILED = 'INSTALL_FAILED';

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


// Install Types
export const INSTALL_STATE = 'INSTALL_STATE';
export const START_DOWNLOAD = 'START_DOWNLOAD';
export const DOWNLOAD_PROGRESS = 'DOWNLOAD_PROGRESS';
export const START_INSTALL = 'START_INSTALL';
export const INSTALL_COMPLETE = 'INSTALL_COMPLETE';
export const START_UNINSTALL = 'START_UNINSTALL';
export const UNINSTALL_COMPLETE = 'UNINSTALL_COMPLETE';
export const INSTALL_ERROR = 'INSTALL_ERROR';

export const acceptedInstallTypes = [
  INSTALL_STATE,
  START_DOWNLOAD,
  DOWNLOAD_PROGRESS,
  START_INSTALL,
  INSTALL_COMPLETE,
  START_UNINSTALL,
  UNINSTALL_COMPLETE,
  INSTALL_ERROR,
];

export const globalEventStatusMap = {
  onDisabled: DISABLED,
  onEnabled: ENABLED,
  onInstalling: INSTALLING,
  onInstalled: INSTALLED,
  onUninstalling: UNINSTALLING,
  onUninstalled: UNINSTALLED,
};

// The events here are set directly on mozAddonManager
// they will be fired by addons and themes that aren't
// necessarily in the disco pane.
export const globalEvents = Object.keys(globalEventStatusMap);
