/* @flow */
/* global window */
import { oneLine } from 'common-tags';
import config from 'config';
import invariant from 'invariant';
import mozCompare from 'mozilla-version-comparator';

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
  INCOMPATIBLE_NON_RESTARTLESS_ADDON,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
  RECOMMENDED,
} from 'amo/constants';
import { findInstallURL } from 'amo/installAddon';
import log from 'amo/logger';
import { getPromotedCategory } from 'amo/utils/addons';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AddonType } from 'amo/types/addons';
import type { ReactRouterLocationType } from 'amo/types/router';

// HACK: This is the GUID for the Facebook Container
// add-on, which has a special-cased download URL supplied.
// See: https://github.com/mozilla/addons-server/issues/7982
export const FACEBOOK_CONTAINER_ADDON_GUID = '@contain-facebook';
export const FACEBOOK_CONTAINER_DOWNLOAD_URL =
  'https://www.mozilla.org/firefox/facebookcontainer/';

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
}: GetCompatibleVersionsParams = {}): CompatibleVersionsType {
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
|}) => {
  invariant(userAgentInfo, 'userAgentInfo is required');

  return userAgentInfo.browser.name === 'Firefox';
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
  addon,
}: {
  addon: AddonType | null,
}): boolean => {
  // Only extensions that are recommended on android are considered compatible.
  // See https://github.com/mozilla/addons-frontend/issues/9713.
  return (
    !!addon &&
    addon.type === ADDON_TYPE_EXTENSION &&
    getPromotedCategory({
      addon,
      clientApp: CLIENT_APP_ANDROID,
    }) === RECOMMENDED
  );
};

export type IsCompatibleWithUserAgentParams = {|
  _config?: typeof config,
  _findInstallURL?: typeof findInstallURL,
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
  _config = config,
  _findInstallURL = findInstallURL,
  _log = log,
  addon,
  currentVersion,
  maxVersion,
  minVersion,
  userAgentInfo,
}: IsCompatibleWithUserAgentParams = {}): UserAgentCompatibilityType {
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
    // Add-ons are not installable in Fenix from AMO yet.
    // See: https://github.com/mozilla/addons-frontend/issues/9864
    if (!_config.get('enableFeatureAllowAndroidInstall')) {
      return { compatible: false, reason: INCOMPATIBLE_ANDROID_UNSUPPORTED };
    }
    // We need to check that the add-on is installable and compatible.
    if (
      !isAndroidInstallable({ addon }) ||
      (currentVersion && !currentVersion.compatibility[CLIENT_APP_ANDROID])
    ) {
      return { compatible: false, reason: INCOMPATIBLE_ANDROID_UNSUPPORTED };
    }
  }

  // At this point we need a currentVersion in order for an extension to be
  // marked as compatible.
  if (!currentVersion) {
    return {
      compatible: false,
      reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
    };
  }

  // Do version checks, if this add-on has minimum or maximum version
  // requirements.
  // The mozilla-version-comparator API is quite strange; a result of
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

  // A result of `-1` means the second argument is a lower version than the
  // first.
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

  // Even if an extension's version is marked compatible,
  // we need to make sure it has a matching platform file
  // to work around some bugs.
  // See https://github.com/mozilla/addons-server/issues/6576
  const { platformFiles } = currentVersion;
  if (
    addon.type === ADDON_TYPE_EXTENSION &&
    !_findInstallURL({ platformFiles, userAgentInfo })
  ) {
    return {
      compatible: false,
      reason: INCOMPATIBLE_UNSUPPORTED_PLATFORM,
    };
  }

  // If we made it here we're compatible (yay!)
  return { compatible: true, reason: null };
}

export type GetClientCompatibilityParams = {|
  _log?: typeof log,
  _window?: typeof window | {},
  addon: AddonType,
  clientApp: string,
  currentVersion: AddonVersionType | null,
  userAgentInfo: UserAgentInfoType,
|};

export type ClientCompatibilityType = {|
  compatible: boolean,
  downloadUrl: string | void,
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
  _log = log,
}: GetClientCompatibilityParams = {}): ClientCompatibilityType {
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

  let downloadUrl;
  if (addon && addon.guid === FACEBOOK_CONTAINER_ADDON_GUID) {
    downloadUrl = FACEBOOK_CONTAINER_DOWNLOAD_URL;
  }

  let compatible = agent.compatible && supportsClientApp;

  if (compatible && addon && addon.isRestartRequired === true) {
    const { browser } = userAgentInfo;

    if (
      browser.name === 'Firefox' &&
      mozCompare(browser.version, '61.0') >= 0
    ) {
      compatible = false;
      reason = INCOMPATIBLE_NON_RESTARTLESS_ADDON;

      _log.debug(
        'add-on is incompatible because it is a non-restartless add-on',
      );
    }
  }

  return {
    compatible,
    downloadUrl,
    maxVersion,
    minVersion,
    reason,
  };
}

export const isQuantumCompatible = ({
  addon,
}: {|
  addon: AddonType,
|}): boolean => {
  // TODO: refactor code that inspects the real compatibility
  // object and re-use that logic to accomplish this instead.
  // https://github.com/mozilla/addons-frontend/issues/3814

  // These checks are fragile because future mozilla-signed extensions
  // may not be Quantum compatible.
  return addon.isWebExtension || addon.isMozillaSignedExtension;
};

export const getMobileHomepageLink = (lang: string) =>
  `/${lang}/${CLIENT_APP_ANDROID}/`;

export const correctedLocationForPlatform = ({
  clientApp,
  isHomePage = false,
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
    (isFirefoxForAndroid(userAgentInfo) && clientApp === CLIENT_APP_FIREFOX) ||
    // Android browser on page other than Home or Search.
    (isFirefoxForAndroid(userAgentInfo) &&
      !isHomePage &&
      !location.pathname.includes('/search/'))
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
