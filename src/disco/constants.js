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
  'hsts-priming@mozilla.org', // Send HSTS Priming Requests
  'd3d9fallback@mozilla.org', // D3D9 Acceleration Fallback
  'asyncrendering@mozilla.org', // Asynchronous Plugin Rendering
  'brotli@mozilla.org', // Disable Brotli on Firefox 44, 45
  'diagnostics@mozilla.org', // Diagnose Firefox update problems
  'malware-remediation@mozilla.org', // Youtube Unblocker Remediation
  'outofdate-notifications@mozilla.org', // Firefox out of date notifications
  'websensehelper@mozilla.org', // Websense Helper
  'tls13-compat-ff51@mozilla.org', // TLS 1.3 Compatibility Testing
  'tls13-comparison-all-v1@mozilla.org', // TLS 1.3 A/B Test Experiment
  'deployment-checker@mozilla.org', // Site Deployment Checker
  'screenshots@mozilla.org', // Firefox Screenshots
  'disable-prefetch@mozilla.org', // Disable Prefetch
  'activity-stream@mozilla.org', // Activity Stream
  'disable-cert-transparency@mozilla.org', // Disable TLS Certificate Transparency
  'disable-ocsp-stapling@mozilla.org', // Disable OCSP Stapling
  'onboarding@mozilla.org', // Photon onboarding
  'followonsearch@mozilla.com', // Follow-on Search Telemetry
  'clicktoplay-rollout@mozilla.org', // Click to Play Rollout
  'tls13-middlebox@mozilla.org', // TLS 1.3 Compatibility Testing of Middleboxes
  'tls13-middlebox-serverhello@mozilla.org', // TLS 1.3 Compatibility Testing of Middleboxes
  'googletestNT@mozillaonline.com', // Google Test Mozilla China
  'disable-media-wmf-nv12@mozilla.org', // Disable Media WMF NV12 format
  'timecop@mozilla.com', // Fixing the geo timeline
  'tls13-middlebox-ghack@mozilla.org', // TLS 1.3 Compatibility Testing of Middleboxes
  '>tp-pref-rollback@mozilla.com', // Tracking Protection preference rollback
  'disable-js-shared-memory@mozilla.org', // Disable JavaScript Shared Memory
  'disable-crash-autosubmit@mozilla.org', // Disable Crash Auto Submit
  'taarexp@mozilla.com', // TAARExperiment
  'tls13-middlebox-draft22@mozilla.org', // TLS 1.3 Compatibility Testing of Middleboxes
  'searchvolmodelextra@mozilla.com', // Search Volume Modeling Extra
  'tls13-rollout-bug1442042@mozilla.org', // TLS 1.3 gradual roll-out
  'tls13-version-fallback-rollout-bug1448176@mozilla.org', // TLS 1.3 gradual roll-out fallback-limit
  'tls13-version-fallback-rollout-bug1462099@mozilla.org', // TLS 1.3 gradual roll-out fallback-limit
  'google-code-correction@mozilla.org', // Google Code Correction
];
