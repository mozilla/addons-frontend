/* @flow */
/* global window */
import { oneLine } from 'common-tags';
import invariant from 'invariant';
import { mozCompare } from 'addons-moz-compare';
import config from 'config';

import {
  USER_AGENT_BROWSER_FIREFOX,
  USER_AGENT_OS_ANDROID,
  USER_AGENT_OS_IOS,
} from 'amo/reducers/api';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  INCOMPATIBLE_ANDROID_UNSUPPORTED,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  RECOMMENDED,
} from 'amo/constants';
import log from 'amo/logger';
import { getPromotedCategory } from 'amo/utils/addons';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AddonType } from 'amo/types/addons';
import type { ReactRouterLocationType } from 'amo/types/router';

export type GetCompatibleVersionsParams = {|
  _log?: typeof log,
  addon: AddonType,
  clientApp: string,
  currentVersion: AddonVersionType | null,
|};

export type CompatibleVersionsType = {|
  supportsClientApp: boolean,
  maxVersion: string | null,
  minVersion: string | null,
|};

export function getCompatibleVersions({
  _log = log,
  addon,
  clientApp,
  currentVersion,
}: GetCompatibleVersionsParams): CompatibleVersionsType {
  let maxVersion = null;
  let minVersion = null;
  // Assume the add-on is incompatible until we see explicit support.
  let supportsClientApp = false;

  if (currentVersion) {
    const compatInfo = currentVersion.compatibility[clientApp];
    if (compatInfo) {
      supportsClientApp = true;
      maxVersion = compatInfo.max;
      minVersion = compatInfo.min;
    }

    if (!supportsClientApp) {
      _log.warn(oneLine`addon guid: "${addon.guid}" is incompatible with
        clientApp: "${clientApp}"`);
    }
  }

  return { supportsClientApp, maxVersion, minVersion };
}

export const isFirefox = ({
  userAgentInfo,
}: {|
  userAgentInfo: UserAgentInfoType,
|}): boolean => {
  invariant(userAgentInfo, 'userAgentInfo is required');

  return userAgentInfo.browser.name === 'Firefox';
};

export const isDesktop = ({
  userAgentInfo,
}: {|
  userAgentInfo: UserAgentInfoType,
|}): boolean => {
  invariant(userAgentInfo, 'userAgentInfo is required');

  return userAgentInfo.device.type === undefined;
};

export const isFirefoxForAndroid = (
  userAgentInfo: UserAgentInfoType,
): boolean => {
  // If the userAgent is false there was likely a programming error.
  invariant(userAgentInfo, 'userAgentInfo is required');

  return (
    isFirefox({ userAgentInfo }) &&
    userAgentInfo.os.name === USER_AGENT_OS_ANDROID
  );
};

export const isFirefoxForIOS = (userAgentInfo: UserAgentInfoType): boolean => {
  // If the userAgent is false there was likely a programming error.
  invariant(userAgentInfo, 'userAgentInfo is required');

  return (
    isFirefox({ userAgentInfo }) && userAgentInfo.os.name === USER_AGENT_OS_IOS
  );
};

export const isAndroidInstallable = ({
  _config = config,
  addon,
}: {
  _config?: typeof config,
  addon: AddonType | null,
}): boolean => {
  if (!addon || addon.type !== ADDON_TYPE_EXTENSION) {
    return false;
  }

  // When we enable this feature, extensions should be installable on Android.
  if (_config.get('enableFeatureMoreAndroidExtensions')) {
    return true;
  }

  // Otherwise, only extensions that are recommended on android are considered
  // compatible, see: https://github.com/mozilla/addons-frontend/issues/9713.
  return (
    getPromotedCategory({ addon, clientApp: CLIENT_APP_ANDROID }) ===
    RECOMMENDED
  );
};

export type IsCompatibleWithUserAgentParams = {|
  _log?: typeof log,
  _window?: typeof window | Object,
  addon: AddonType,
  currentVersion: AddonVersionType | null,
  maxVersion: string | null,
  minVersion: string | null,
  userAgentInfo: UserAgentInfoType,
|};

export type UserAgentCompatibilityType = {|
  compatible: boolean,
  reason: string | null,
|};

export function isCompatibleWithUserAgent({
  _log = log,
  addon,
  currentVersion,
  maxVersion,
  minVersion,
  userAgentInfo,
}: IsCompatibleWithUserAgentParams): UserAgentCompatibilityType {
  // If the userAgent is false there was likely a programming error.
  invariant(userAgentInfo, 'userAgentInfo is required');

  const { browser } = userAgentInfo;

  // We need a Firefox browser compatible with add-ons (Firefox for iOS does
  // not currently support add-ons).
  if (isFirefoxForIOS(userAgentInfo)) {
    return { compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS };
  }

  if (!isFirefox({ userAgentInfo })) {
    return { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX };
  }

  if (isFirefoxForAndroid(userAgentInfo)) {
    // We need to check that the add-on is installable and compatible.
    if (
      !isAndroidInstallable({ addon }) ||
      (currentVersion && !currentVersion.compatibility[CLIENT_APP_ANDROID])
    ) {
      return { compatible: false, reason: INCOMPATIBLE_ANDROID_UNSUPPORTED };
    }
  }

  // At this point we need a currentVersion and a file in order for an
  // extension to be marked as compatible.
  if (!currentVersion || !currentVersion.file) {
    return {
      compatible: false,
      reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
    };
  }

  // Do version checks, if this add-on has minimum or maximum version
  // requirements.
  // The addons-moz-compare API is quite strange; a result of
  // `1` means the first argument is higher in version than the second.
  //
  // Being over the maxVersion, oddly, is not actually a reason to
  // disable the install button or mark the add-on as incompatible
  // with this version of Firefox. But we log the version mismatch
  // here so it's not totally silent and a future developer isn't as
  // confused by this as tofumatt was.
  // See: https://github.com/mozilla/addons-frontend/issues/2074#issuecomment-286983423
  if (maxVersion && mozCompare(browser.version, maxVersion) === 1) {
    if (currentVersion.isStrictCompatibilityEnabled) {
      return { compatible: false, reason: INCOMPATIBLE_OVER_MAX_VERSION };
    }

    _log.info(oneLine`maxVersion ${maxVersion} for add-on lower than
      browser version ${browser.version}, but add-on still marked as
      compatible because we largely ignore maxVersion. See:
      https://github.com/mozilla/addons-frontend/issues/2074`);
  }

  // A result of `-1` means the first argument is a lower version than the
  // second.
  if (minVersion && mozCompare(browser.version, minVersion) === -1) {
    if (minVersion === '*') {
      _log.error(oneLine`minVersion of "*" was passed to
        isCompatibleWithUserAgent(); bad add-on version data (browserVersion:
        ${browser.version})`);
    }

    // `minVersion` is always respected, regardless of
    // `isStrictCompatibilityEnabled`'s value.
    return { compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION };
  }

  // If we made it here we're compatible (yay!)
  return { compatible: true, reason: null };
}

export type GetClientCompatibilityParams = {|
  _window?: typeof window | {},
  addon: AddonType,
  clientApp: string,
  currentVersion: AddonVersionType | null,
  userAgentInfo: UserAgentInfoType,
|};

export type ClientCompatibilityType = {|
  compatible: boolean,
  maxVersion: string | null,
  minVersion: string | null,
  reason: string | null,
|};

export function getClientCompatibility({
  addon,
  clientApp,
  currentVersion,
  userAgentInfo,
  _window = typeof window !== 'undefined' ? window : {},
}: GetClientCompatibilityParams): ClientCompatibilityType {
  // Check compatibility with client app.
  const { supportsClientApp, maxVersion, minVersion } = getCompatibleVersions({
    addon,
    clientApp,
    currentVersion,
  });

  // Check compatibility with user agent.
  const agent = isCompatibleWithUserAgent({
    addon,
    currentVersion,
    maxVersion,
    minVersion,
    userAgentInfo,
    _window,
  });

  let { reason } = agent;
  if (!supportsClientApp && !reason) {
    reason = INCOMPATIBLE_UNSUPPORTED_PLATFORM;
  }

  return {
    compatible: agent.compatible && supportsClientApp,
    maxVersion,
    minVersion,
    reason,
  };
}

export const getMobileHomepageLink = (lang: string): string =>
  `/${lang}/${CLIENT_APP_ANDROID}/`;

export const correctedLocationForPlatform = ({
  clientApp,
  lang,
  location,
  userAgentInfo,
}: {|
  clientApp: string,
  isHomePage?: boolean,
  lang: string,
  location: ReactRouterLocationType,
  userAgentInfo: UserAgentInfoType,
|}): string | null => {
  // If the userAgent is false there was likely a programming error.
  invariant(userAgentInfo, 'userAgentInfo is required');

  const { browser, os } = userAgentInfo;

  if (isFirefoxForIOS(userAgentInfo) || !isFirefox({ userAgentInfo })) {
    return null;
  }

  if (
    // Android browser on desktop site.
    isFirefoxForAndroid(userAgentInfo) &&
    clientApp === CLIENT_APP_FIREFOX
  ) {
    // Redirect to `android` home page.
    return getMobileHomepageLink(lang);
  }

  if (
    os.name !== USER_AGENT_OS_ANDROID &&
    browser.name === USER_AGENT_BROWSER_FIREFOX &&
    clientApp === CLIENT_APP_ANDROID
  ) {
    // Desktop browser on android site: Redirect to same page on `firefox`.
    return `${location.pathname.replace(
      CLIENT_APP_ANDROID,
      CLIENT_APP_FIREFOX,
    )}${location.search}`;
  }

  return null;
};
