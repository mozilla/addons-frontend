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
export const API_THEME_TYPE = 'persona';
export const EXTENSION_TYPE = 'extension';
export const THEME_TYPE = 'theme';
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
