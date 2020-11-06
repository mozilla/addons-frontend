/* @flow */

// Addon States.
export const DISABLED = 'DISABLED';
export const DISABLING = 'DISABLING';
export const DOWNLOADING = 'DOWNLOADING';
export const ENABLED = 'ENABLED';
export const ENABLING = 'ENABLING';
export const ERROR = 'ERROR';
export const INACTIVE = 'INACTIVE';
export const INSTALLED = 'INSTALLED';
export const INSTALLING = 'INSTALLING';
export const UNINSTALLED = 'UNINSTALLED';
export const UNINSTALLING = 'UNINSTALLING';
export const UNKNOWN = 'UNKNOWN';
export const validInstallStates = [
  DISABLED,
  DISABLING,
  DOWNLOADING,
  ENABLED,
  ENABLING,
  ERROR,
  INACTIVE,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
];

// Add-on error states.
export const DOWNLOAD_FAILED = 'DOWNLOAD_FAILED';
export const INSTALL_CANCELLED = 'INSTALL_CANCELLED';
export const INSTALL_FAILED = 'INSTALL_FAILED';
export const ERROR_CORRUPT_FILE = 'ERROR_CORRUPT_FILE';

// Unrecoverable errors.
export const FATAL_INSTALL_ERROR = 'FATAL_INSTALL_ERROR';
export const FATAL_UNINSTALL_ERROR = 'FATAL_UNINSTALL_ERROR';
export const FATAL_ERROR = 'FATAL_ERROR';

// Client App types
export const CLIENT_APP_ANDROID = 'android';
export const CLIENT_APP_FIREFOX = 'firefox';

// Add-on types.
export const ADDON_TYPE_DICT = 'dictionary';
export const ADDON_TYPE_EXTENSION = 'extension';
export const ADDON_TYPE_LANG = 'language';
export const ADDON_TYPE_STATIC_THEME = 'statictheme';

export type AddonTypeType =
  | typeof ADDON_TYPE_DICT
  | typeof ADDON_TYPE_EXTENSION
  | typeof ADDON_TYPE_LANG
  | typeof ADDON_TYPE_STATIC_THEME;

export const validAddonTypes = [
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
];
// Mapping of the add-on types we show in URLs, etc. and what they map
// to in the API (and how they're represented internally in the app).
//
// Examples:
// * '/extensions/' -> 'extension'
// * '/themes/' -> 'statictheme'
export const API_ADDON_TYPES_MAPPING = {
  extensions: ADDON_TYPE_EXTENSION,
  themes: ADDON_TYPE_STATIC_THEME,
};
export const VISIBLE_ADDON_TYPES_MAPPING = Object.keys(
  API_ADDON_TYPES_MAPPING,
).reduce(
  (object, key: string) => ({
    ...object,
    [API_ADDON_TYPES_MAPPING[key]]: key,
  }),
  {},
);

// Incompatibility codes for clients that can't install an add-on.
export const INCOMPATIBLE_FIREFOX_FOR_IOS = 'INCOMPATIBLE_FIREFOX_FOR_IOS';
export const INCOMPATIBLE_OVER_MAX_VERSION = 'INCOMPATIBLE_OVER_MAX_VERSION';
export const INCOMPATIBLE_NOT_FIREFOX = 'INCOMPATIBLE_NOT_FIREFOX';
export const INCOMPATIBLE_UNDER_MIN_VERSION = 'INCOMPATIBLE_UNDER_MIN_VERSION';
export const INCOMPATIBLE_UNSUPPORTED_PLATFORM =
  'INCOMPATIBLE_UNSUPPORTED_PLATFORM';
export const INCOMPATIBLE_NON_RESTARTLESS_ADDON =
  'INCOMPATIBLE_NON_RESTARTLESS_ADDON';
export const INCOMPATIBLE_ANDROID_UNSUPPORTED =
  'INCOMPATIBLE_ANDROID_UNSUPPORTED';

// Tracking add-on types
export const TRACKING_TYPE_EXTENSION = 'addon';
export const TRACKING_TYPE_STATIC_THEME = ADDON_TYPE_STATIC_THEME;
export const TRACKING_TYPE_INVALID = 'invalid';

// Add-on install tracking sources.
// These key values may be linked to historic analytic data.
export const INSTALL_SOURCE_COLLECTION = 'collection';
export const INSTALL_SOURCE_FEATURED_COLLECTION =
  'homepage-collection-featured';
export const INSTALL_SOURCE_DETAIL_PAGE = 'dp-btn-primary';
export const INSTALL_SOURCE_FEATURED = 'featured';
export const INSTALL_SOURCE_HERO_PROMO = 'hp-dl-promo';
export const INSTALL_SOURCE_MOST_POPULAR = 'mostpopular';
export const INSTALL_SOURCE_PROMOTED_SHELF = 'homepage-sponsored-shelf';
export const INSTALL_SOURCE_SEARCH = 'search';
export const INSTALL_SOURCE_TOP_RATED = 'rating';
export const INSTALL_SOURCE_TRENDING = 'hotness';

// View Contexts that aren't an addonType
export const VIEW_CONTEXT_EXPLORE = 'VIEW_CONTEXT_EXPLORE';
export const VIEW_CONTEXT_HOME = 'VIEW_CONTEXT_HOME';
// Language tools contain both ADDON_TYPE_DICT and ADDON_TYPE_LANG so
// we share a custom view context for both add-on types.
export const VIEW_CONTEXT_LANGUAGE_TOOLS = 'VIEW_CONTEXT_LANGUAGE_TOOLS';

// Add-on Search Sort Values
export const SEARCH_SORT_TRENDING = 'hotness';
export const SEARCH_SORT_TOP_RATED = 'rating';
export const SEARCH_SORT_POPULAR = 'users';
export const SEARCH_SORT_RANDOM = 'random';
export const SEARCH_SORT_RELEVANCE = 'relevance';
export const SEARCH_SORT_UPDATED = 'updated';
export const SEARCH_SORT_RECOMMENDED = 'recommended';

// Collection add-ons sort values
export const COLLECTION_SORT_DATE_ADDED_ASCENDING = 'added';
export const COLLECTION_SORT_DATE_ADDED_DESCENDING = '-added';
export const COLLECTION_SORT_NAME = 'name';
export const COLLECTION_SORT_POPULARITY_DESCENDING = '-popularity';

// Operating system for add-ons and files
export const OS_ALL = 'all';
export const OS_WINDOWS = 'windows';
export const OS_MAC = 'mac';
export const OS_LINUX = 'linux';
export const OS_ANDROID = 'android';

// Action types.
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const FEATURED_GET = 'FEATURED_GET';
export const FEATURED_LOADED = 'FEATURED_LOADED';
export const SET_ERROR = 'SET_ERROR';
export const SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE';
export const SET_VIEW_CONTEXT = 'SET_VIEW_CONTEXT';

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

// Tracking install actions.
export const ENABLE_ACTION = 'enable';
export const INSTALL_ACTION = 'install';
export const INSTALL_CANCELLED_ACTION = 'install:cancelled';
export const INSTALL_DOWNLOAD_FAILED_ACTION = 'install:download-failed';
export const INSTALL_STARTED_ACTION = 'install:started';
export const UNINSTALL_ACTION = 'uninstall';

// Tracking Event Categories.
// WARNING: Do not change these without notifying data + metrics teams.
// Changing these strings will break existing statistics without
// updating the category matching at the same time.
export const ENABLE_EXTENSION_CATEGORY = 'AMO Addon Activation';
export const ENABLE_THEME_CATEGORY = 'AMO Theme Activation';

export const INSTALL_EXTENSION_CATEGORY = 'AMO Addon Installs';
export const INSTALL_THEME_CATEGORY = 'AMO Theme Installs';

export const INSTALL_CANCELLED_EXTENSION_CATEGORY =
  'AMO Addon Installs Cancelled';
export const INSTALL_CANCELLED_THEME_CATEGORY = 'AMO Theme Installs Cancelled';

export const INSTALL_DOWNLOAD_FAILED_EXTENSION_CATEGORY =
  'AMO Addon Installs Download Failed';
export const INSTALL_DOWNLOAD_FAILED_THEME_CATEGORY =
  'AMO Theme Installs Download Failed';

export const INSTALL_STARTED_EXTENSION_CATEGORY = 'AMO Addon Installs Started';
export const INSTALL_STARTED_THEME_CATEGORY = 'AMO Theme Installs Started';

export const UNINSTALL_EXTENSION_CATEGORY = 'AMO Addon Uninstalls';
export const UNINSTALL_THEME_CATEGORY = 'AMO Theme Uninstalls';

export const CLICK_CATEGORY = 'AMO Addon / Theme Clicks';

export const SURVEY_CATEGORY = 'AMO Addon / Experience Survey Notice';
export const SURVEY_ACTION_DISMISSED = 'Dismissed survey notice';
export const SURVEY_ACTION_SHOWN = 'Shown survey notice';
export const SURVEY_ACTION_VISITED = 'Visited survey';

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
// This mozAddonManager event has no one-to-one mapping.
export const ON_INSTALLING_EVENT = 'onInstalling';
export const ON_OPERATION_CANCELLED_EVENT = 'onOperationCancelled';
export const ON_UNINSTALLED_EVENT = 'onUninstalled';

// The events here are set directly on mozAddonManager
// they will be fired by addons and themes.
export const GLOBAL_EVENTS: Array<
  $Keys<typeof GLOBAL_EVENT_STATUS_MAP>,
> = Object.keys(GLOBAL_EVENT_STATUS_MAP);

// Generic error codes.
export const ERROR_UNKNOWN = 'ERROR_UNKNOWN';
// API error codes. These values match the error codes defined here:
// http://addons-server.readthedocs.io/en/latest/topics/api/overview.html#unauthorized-and-permission-denied
export const API_ERROR_DECODING_SIGNATURE = 'ERROR_DECODING_SIGNATURE';
export const API_ERROR_INVALID_HEADER = 'ERROR_INVALID_HEADER';
export const API_ERROR_SIGNATURE_EXPIRED = 'ERROR_SIGNATURE_EXPIRED';
// Interpreted error codes.
export const ERROR_ADDON_DISABLED_BY_DEV = 'ERROR_ADDON_DISABLED_BY_DEV';
export const ERROR_ADDON_DISABLED_BY_ADMIN = 'ERROR_ADDON_DISABLED_BY_ADMIN';

// This is the limit in milleseconds for how long a setTimeout delay can be.
// No setTimeout should be scheduled for this time because it
// will be triggered immediately.
// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Maximum_delay_value
export const maximumSetTimeoutDelay = 2147483647;

// Allows viewing and editing of any add-ons details in developer tools.
export const ADDONS_EDIT = 'Addons:Edit';
// Can access the add-on reviewer tools to approve/reject add-on submissions.
export const ADDONS_REVIEW = 'Addons:Review';
// Can view statistics for all addons, regardless of privacy settings.
export const STATS_VIEW = 'Stats:View';
// Can edit all Mozilla-owned collections.
export const MOZILLA_COLLECTIONS_EDIT = 'Admin:Curation';
// Can edit the special Featured Themes collection.
export const FEATURED_THEMES_COLLECTION_EDIT = 'Collections:Contribute';
// The slug for the special Featured Themes collection.
export const FEATURED_THEMES_COLLECTION_SLUG = 'featured-personas';
// Can approve add-ons content.
export const ADDONS_CONTENT_REVIEW = 'Addons:ContentReview';
// Can review unlisted add-ons.
export const ADDONS_REVIEW_UNLISTED = 'Addons:ReviewUnlisted';
// Can moderate user ratings on add-ons.
export const RATINGS_MODERATE = 'Ratings:Moderate';
// Can edit user accounts.
export const USERS_EDIT = 'Users:Edit';
// Super powers. It means absolutely all permissions.
export const ALL_SUPER_POWERS = '*:*';
// Can view only the reviewer tools.
export const REVIEWER_TOOLS_VIEW = 'ReviewerTools:View';
// Can review recommend(ed|able) add-ons.
export const ADDONS_RECOMMENDED_REVIEW = 'Addons:RecommendedReview';
// Can review a static theme.
export const STATIC_THEMES_REVIEW = 'Addons:ThemeReview';

export const RTL = 'rtl';
export const LTR = 'ltr';

export const AMO_REQUEST_ID_HEADER = 'amo-request-id';

export const DEFAULT_UTM_SOURCE = 'addons.mozilla.org';
export const DEFAULT_UTM_MEDIUM = 'referral';

// Promoted categories
export const LINE = 'line';
export const RECOMMENDED = 'recommended';
export const SPONSORED = 'sponsored';
export const SPOTLIGHT = 'spotlight';
export const STRATEGIC = 'strategic';
export const VERIFIED = 'verified';

export const ALL_PROMOTED_CATEGORIES = [
  LINE,
  RECOMMENDED,
  SPONSORED,
  SPOTLIGHT,
  STRATEGIC,
  VERIFIED,
];
export const BADGE_CATEGORIES = [LINE, RECOMMENDED, VERIFIED];
export const EXCLUDE_WARNING_CATEGORIES = [
  LINE,
  RECOMMENDED,
  SPONSORED,
  SPOTLIGHT,
  VERIFIED,
];
export const REVIEWED_FILTER = 'badged';
export const VERIFIED_FILTER = `${SPONSORED},${VERIFIED}`;

export type PromotedCategoryType =
  | typeof LINE
  | typeof RECOMMENDED
  | typeof SPONSORED
  | typeof SPOTLIGHT
  | typeof STRATEGIC
  | typeof VERIFIED;

export const APP_NAME = 'amo';
