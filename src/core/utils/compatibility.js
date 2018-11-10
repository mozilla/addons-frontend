/* @flow */
/* global window */
import { oneLine } from 'common-tags';
import invariant from 'invariant';
import mozCompare from 'mozilla-version-comparator';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NON_RESTARTLESS_ADDON,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'core/constants';
import { findInstallURL } from 'core/installAddon';
import log from 'core/logger';
import type { AddonVersionType } from 'core/reducers/versions';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { AddonType } from 'core/types/addons';

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

  if (currentVersion && currentVersion.compatibility) {
    const compatInfo = currentVersion.compatibility[clientApp];
    if (compatInfo) {
      supportsClientApp = true;
      maxVersion = compatInfo.max;
      minVersion = compatInfo.min;
    }

    if (!supportsClientApp) {
      _log.warn('addon is incompatible with clientApp', { addon, clientApp });
    }
  }

  return { supportsClientApp, maxVersion, minVersion };
}

export type IsCompatibleWithUserAgentParams = {|
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
  _findInstallURL = findInstallURL,
  _log = log,
  _window = typeof window !== 'undefined' ? window : {},
  addon,
  currentVersion,
  maxVersion,
  minVersion,
  userAgentInfo,
}: IsCompatibleWithUserAgentParams = {}): UserAgentCompatibilityType {
  // If the userAgent is false there was likely a programming error.
  invariant(userAgentInfo, 'userAgentInfo is required');

  const { browser, os } = userAgentInfo;

  // We need a Firefox browser compatible with add-ons (Firefox for iOS does
  // not currently support add-ons).
  if (browser.name === 'Firefox' && os.name === 'iOS') {
    return { compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS };
  }

  if (
    addon.type === ADDON_TYPE_OPENSEARCH &&
    !(_window.external && 'AddSearchProvider' in _window.external)
  ) {
    return { compatible: false, reason: INCOMPATIBLE_NO_OPENSEARCH };
  }

  if (browser.name !== 'Firefox') {
    return { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX };
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
      _log.error(
        oneLine`minVersion of "*" was passed to isCompatibleWithUserAgent();
        bad add-on version data`,
        { browserVersion: browser.version, minVersion },
      );
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
    !_findInstallURL({
      appendSource: false,
      platformFiles,
      userAgentInfo,
    })
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

  let reason;
  if (!supportsClientApp) {
    reason = INCOMPATIBLE_UNSUPPORTED_PLATFORM;
  } else {
    reason = agent.reason;
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
