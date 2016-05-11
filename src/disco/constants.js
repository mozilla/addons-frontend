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
export const THEME_TYPE = 'Theme';
export const EXTENSION_TYPE = 'Extension';
export const validAddonTypes = [
  THEME_TYPE,
  EXTENSION_TYPE,
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
