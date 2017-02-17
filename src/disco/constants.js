// Tracking categories.
export const VIDEO_CATEGORY = 'Discovery Video';
export const NAVIGATION_CATEGORY = 'Discovery Navigation';

// Action types.
export const DISCO_RESULTS = 'DISCO_RESULTS';

// Keys for extensions and theme data in the discovery pane JSON blob.
export const DISCO_DATA_THEME = 'theme';
export const DISCO_DATA_EXTENSION = 'extension';
export const DISCO_DATA_UNKNOWN = 'unknown';
// Built-in extensions and themes to ignore.
export const DISCO_DATA_GUID_IGNORE_LIST = [
  '{972ce4c6-7e08-4474-a285-3208198ce6fd}', // Default theme
  'firefox-compact-light@mozilla.org@personas.mozilla.org', // Default Compact Light theme
  'firefox-compact-dark@mozilla.org@personas.mozilla.org', // Default Compact Dark theme
  'e10srollout@mozilla.org', // e10s
  'firefox@getpocket.com', // Pocket
  'loop@mozilla.org', // Firefox Hello
  'aushelper@mozilla.org', // Application Update Service Helper
  'webcompat@mozilla.org', // Web Compat
  'flyweb@mozilla.org', // FlyWeb
  'formautofill@mozilla.org', // Form Autofill
  'presentation@mozilla.org', // Presentation
  'shield-recipe-client@mozilla.org', // Shield Recipe Client
  'webcompat-reporter@mozilla.org', // WebCompat Reporter 
  'disableSHA1rollout@mozilla.org', // SHA-1 deprecation staged rollout 
];
