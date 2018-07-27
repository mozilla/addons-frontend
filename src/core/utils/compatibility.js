/* global window */
import { oneLine } from 'common-tags';
import mozCompare from 'mozilla-version-comparator';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_OPENSEARCH,
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'core/constants';
import { findInstallURL } from 'core/installAddon';
import log from 'core/logger';

// HACK: This is the GUID for the Facebook Container
// add-on, which has a special-cased download URL supplied.
// See: https://github.com/mozilla/addons-server/issues/7982
export const FACEBOOK_CONTAINER_ADDON_GUID = '@contain-facebook';
export const FACEBOOK_CONTAINER_DOWNLOAD_URL =
  'https://www.mozilla.org/firefox/facebookcontainer/';

export function getCompatibleVersions({ _log = log, addon, clientApp } = {}) {
  let maxVersion = null;
  let minVersion = null;
  // Assume the add-on is incompatible until we see explicit support
  // in current_version.compatibility
  let supportsClientApp = false;

  if (addon) {
    if (
      addon.current_version &&
      addon.current_version.compatibility[clientApp]
    ) {
      supportsClientApp = true;
      maxVersion = addon.current_version.compatibility[clientApp].max;
      minVersion = addon.current_version.compatibility[clientApp].min;
    }

    if (!supportsClientApp) {
      _log.warn('addon is incompatible with clientApp', { addon, clientApp });
    }
  }

  return { supportsClientApp, maxVersion, minVersion };
}

export function isCompatibleWithUserAgent({
  _log = log,
  _window = typeof window !== 'undefined' ? window : {},
  addon,
  maxVersion,
  minVersion,
  userAgentInfo,
} = {}) {
  // If the userAgent is false there was likely a programming error.
  if (!userAgentInfo) {
    throw new Error('userAgentInfo is required');
  }

  const { browser, os } = userAgentInfo;

  // We need a Firefox browser compatible with add-ons (Firefox for iOS does
  // not currently support add-ons).
  if (browser.name === 'Firefox' && os.name === 'iOS') {
    return { compatible: false, reason: INCOMPATIBLE_FIREFOX_FOR_IOS };
  }

  if (browser.name === 'Firefox') {
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
      if (addon.current_version.is_strict_compatibility_enabled) {
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
      // `is_strict_compatibility_enabled`'s value.
      return { compatible: false, reason: INCOMPATIBLE_UNDER_MIN_VERSION };
    }

    if (
      addon.type === ADDON_TYPE_OPENSEARCH &&
      !(_window.external && 'AddSearchProvider' in _window.external)
    ) {
      return { compatible: false, reason: INCOMPATIBLE_NO_OPENSEARCH };
    }

    // Even if an extension's version is marked compatible,
    // we need to make sure it has a matching platform file
    // to work around some bugs.
    // See https://github.com/mozilla/addons-server/issues/6576
    if (
      addon.type === ADDON_TYPE_EXTENSION &&
      !findInstallURL({
        appendSource: false,
        platformFiles: addon.platformFiles,
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

  // This means the client is not Firefox, so it's incompatible.
  return { compatible: false, reason: INCOMPATIBLE_NOT_FIREFOX };
}

export function getClientCompatibility({
  _window = typeof window !== 'undefined' ? window : {},
  addon,
  clientApp,
  userAgentInfo,
} = {}) {
  // Check compatibility with client app.
  const { maxVersion, minVersion, supportsClientApp } = getCompatibleVersions({
    addon,
    clientApp,
  });

  // Check compatibility with user agent.
  const agent = isCompatibleWithUserAgent({
    addon,
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

  return {
    compatible: agent.compatible && supportsClientApp,
    downloadUrl,
    maxVersion,
    minVersion,
    reason,
  };
}

export const isQuantumCompatible = ({ addon }) => {
  // TODO: refactor code that inspects the real compatibility
  // object and re-use that logic to accomplish this instead.
  // https://github.com/mozilla/addons-frontend/issues/3814

  // These checks are fragile because future mozilla-signed extensions
  // may not be Quantum compatible.
  return addon.isWebExtension || addon.isMozillaSignedExtension;
};
