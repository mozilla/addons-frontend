/* @flow */
/* global navigator, window */
// GTM-based analytics tracking module.
//
// Uses `window.dataLayer.push()` to send events to Google Tag Manager (GTM).
// The `Tracking` class is instantiated once as a singleton (exported at the
// bottom of this file) and shared across the entire application.
//
// Also exports helper functions for building standardized GA4 event
// parameters: `getAddonNameParam`, `getAddonEventParams`, and
// `getAddonEventCategory`.
import { oneLine } from 'common-tags';
import config from 'config';

import {
  ADDON_TYPE_STATIC_THEME,
  ENABLE_ACTION,
  ENABLE_EXTENSION_CATEGORY,
  ENABLE_THEME_CATEGORY,
  INSTALL_CANCELLED_ACTION,
  INSTALL_CANCELLED_EXTENSION_CATEGORY,
  INSTALL_CANCELLED_THEME_CATEGORY,
  INSTALL_DOWNLOAD_FAILED_ACTION,
  INSTALL_DOWNLOAD_FAILED_EXTENSION_CATEGORY,
  INSTALL_DOWNLOAD_FAILED_THEME_CATEGORY,
  INSTALL_EXTENSION_CATEGORY,
  INSTALL_STARTED_ACTION,
  INSTALL_STARTED_EXTENSION_CATEGORY,
  INSTALL_STARTED_THEME_CATEGORY,
  INSTALL_THEME_CATEGORY,
  UNINSTALL_ACTION,
  UNINSTALL_EXTENSION_CATEGORY,
  UNINSTALL_THEME_CATEGORY,
} from 'amo/constants';
import log from 'amo/logger';
import { convertBoolean } from 'amo/utils';

export type SendTrackingEventParams = {|
  _config?: typeof config,
  category: string,
  sendSecondEventWithOverrides?: {|
    category?: string,
    params?: Object,
  |},
  params?: Object,
|};

type TrackingEventDataParams = {
  [string]: string | boolean | number,
};

type IsDoNoTrackEnabledParams = {
  _log: typeof log,
  _navigator: ?typeof navigator,
  _window: ?typeof window,
};

export function isDoNotTrackEnabled({
  _log = log,
  // The type above is correct but Flow complains about `Navigator` being
  // incompatible with `null`, so $FlowIgnore.
  _navigator = typeof navigator !== 'undefined' ? navigator : null,
  _window = typeof window !== 'undefined' ? window : null,
}: IsDoNoTrackEnabledParams = {}): boolean {
  if (!_navigator || !_window) {
    return false;
  }

  // We ignore things like `msDoNotTrack` because they are for older,
  // unsupported browsers and don't really respect the DNT spec. This
  // covers new versions of IE/Edge, Firefox from 32+, Chrome, Safari, and
  // any browsers built on these stacks (Chromium, Tor Browser, etc.).
  const dnt = _navigator.doNotTrack || _window.doNotTrack;
  if (dnt === '1') {
    _log.info('Do Not Track is enabled');
    return true;
  }

  // Known DNT values not set, so we will assume it's off.
  return false;
}

type TrackingParams = {
  _config: typeof config,
  _isDoNotTrackEnabled: typeof isDoNotTrackEnabled,
};

/*
 * Singleton tracking class that wraps Google Tag Manager's dataLayer.
 *
 * A single instance is created at the bottom of this module and exported as
 * the default export. All components import that instance rather than
 * constructing their own.
 */
export class Tracking {
  _log: typeof log;

  logPrefix: string;

  trackingEnabled: boolean;

  gtmContainerId: string;

  constructor({
    _config = config,
    _isDoNotTrackEnabled = isDoNotTrackEnabled,
  }: TrackingParams = {}) {
    if (typeof window === 'undefined') {
      return;
    }

    this._log = log;
    this.logPrefix = '[GA]'; // this gets updated below
    this.gtmContainerId = _config.get('gtmContainerId');

    if (!convertBoolean(_config.get('trackingEnabled'))) {
      this.log('GA disabled because trackingEnabled was false');
      this.trackingEnabled = false;
    } else if (!this.gtmContainerId) {
      this.log('GA Disabled because gtmContainerId is empty');
      this.trackingEnabled = false;
    } else if (_isDoNotTrackEnabled()) {
      this.log(oneLine`Do Not Track Enabled; Google Analytics not
        loaded and tracking disabled`);
      this.trackingEnabled = false;
    } else {
      this.log('Google Analytics is enabled');
      this.trackingEnabled = true;
    }

    this.logPrefix = `[GA: ${this.trackingEnabled ? 'ON' : 'OFF'}]`;

    if (this.trackingEnabled) {
      window.dataLayer = window.dataLayer || [];
      // Bootstrap GTM: push the gtm.start timestamp so GTM knows when it
      // was initialized. GTM replays any dataLayer items it finds on load.
      // Guard against duplicate pushes when multiple Tracking instances are
      // created (e.g. in tests or hot-reload scenarios).
      if (!window.dataLayer.some((e) => e.event === 'gtm.js')) {
        window.dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js',
        });
      }
    }
  }

  log(message: string, obj?: Object) {
    if (this._log) {
      const pattern = typeof obj === 'undefined' ? '%s %s' : '%s %s: %o';
      // eslint-disable-next-line amo/only-log-strings
      this._log.info(pattern, this.logPrefix, message, obj);
    }
  }

  // Low-level push to GTM's dataLayer, gated by `trackingEnabled`.
  // All public methods route through here so that disabled tracking
  // is handled in one place.
  _pushToDataLayer(eventData: Object) {
    if (this.trackingEnabled) {
      window.dataLayer.push(eventData);
    }
  }

  /*
   * Param                            Type    Required  Description
   * obj.category                     String  Yes       The event name
   *                                                    (e.g. amo_addon_installs_completed)
   * obj.params                       Object  No        Additional event parameters
   *                                                    (e.g. { extension_name, author, page_path })
   * obj.sendSecondEventWithOverrides Object  No        If passed, an extra
   *                                                    event will be sent
   *                                                    using the object's
   *                                                    properties as overrides
   */
  sendEvent({
    _config = config,
    category,
    params,
    sendSecondEventWithOverrides,
  }: SendTrackingEventParams) {
    if (!category) {
      throw new Error('sendEvent: category is required');
    }

    if (_config.get('server')) {
      // It is not possible to send GA events from the server, but a developer
      // might call this function from code that executes on the server. This
      // exception will act as a warning that the code should be altered or
      // moved.
      throw new Error('sendEvent: cannot send tracking events on the server');
    } else {
      // `params` is optional; callers may pass `undefined`, so we default
      // to an empty object to keep the spread safe.
      const baseParams: TrackingEventDataParams =
        ((params: any): TrackingEventDataParams) || {};
      const data: TrackingEventDataParams = {
        ...baseParams,
        event: category,
      };
      this._pushToDataLayer(data);
      this.log('sendEvent', data);

      if (sendSecondEventWithOverrides) {
        const secondParams: TrackingEventDataParams =
          ((sendSecondEventWithOverrides.params: any): TrackingEventDataParams) ||
          {};
        const secondData: TrackingEventDataParams = {
          ...baseParams,
          ...secondParams,
          event: sendSecondEventWithOverrides.category || category,
        };
        this._pushToDataLayer(secondData);
        this.log('sendEvent', secondData);
      }
    }
  }

  /*
   * Can be called to set user properties which will be sent with all subsequent
   * calls to GA4.
   */
  setUserProperties(props: { [string]: string }) {
    // $FlowIgnore
    this._pushToDataLayer({
      event: 'set_user_properties',
      user_properties: props,
    });
    this.log('setUserProperties', props);
  }
}

// Returns { extension_name: name } or { theme_name: name } based on addon type
export function getAddonNameParam(addon: {
  +name: string | null,
  +type: string,
  ...
}): TrackingEventDataParams {
  if (!addon.name) {
    return {};
  }
  const isTheme = addon.type === ADDON_TYPE_STATIC_THEME;
  return isTheme ? { theme_name: addon.name } : { extension_name: addon.name };
}

/*
 * Build the standard parameter object for an addon-related GA4 event.
 *
 * Accepts a nullable `addon` and an optional `pagePath`:
 *   - When `addon` is null/undefined, returns `{}` or `{ page_path }`.
 *   - When `addon` is present, includes `extension_name` or `theme_name`
 *     (via `getAddonNameParam`), the first author's name (if non-empty),
 *     and the page path.
 *
 * Used by most components to build consistent event params for sendEvent().
 */
export function getAddonEventParams(
  addon: ?{
    +name: string,
    +type: string,
    +authors?: $ReadOnlyArray<{ +name: string, ... }>,
    ...
  },
  pagePath?: string,
): TrackingEventDataParams {
  if (!addon) {
    return pagePath ? { page_path: pagePath } : {};
  }

  const nameParam = getAddonNameParam(addon);
  const author =
    addon.authors && addon.authors.length > 0 && addon.authors[0].name
      ? addon.authors[0].name
      : undefined;
  const eventParams: TrackingEventDataParams = { ...nameParam };
  if (author) {
    eventParams.author = author;
  }
  if (pagePath) {
    eventParams.page_path = pagePath;
  }

  return eventParams;
}

// Maps an addon type and install action to the correct GA4 event category
// string. Extensions and themes each have their own set of category constants
// (e.g. `amo_addon_installs_completed` vs `amo_theme_installs_completed`).
// The `default` case handles install-completed (no explicit action constant).
export const getAddonEventCategory = (
  type: string,
  installAction?: string,
): string => {
  const isThemeType = ADDON_TYPE_STATIC_THEME === type;

  switch (installAction) {
    case ENABLE_ACTION:
      return isThemeType ? ENABLE_THEME_CATEGORY : ENABLE_EXTENSION_CATEGORY;
    case INSTALL_CANCELLED_ACTION:
      return isThemeType
        ? INSTALL_CANCELLED_THEME_CATEGORY
        : INSTALL_CANCELLED_EXTENSION_CATEGORY;
    case INSTALL_DOWNLOAD_FAILED_ACTION:
      return isThemeType
        ? INSTALL_DOWNLOAD_FAILED_THEME_CATEGORY
        : INSTALL_DOWNLOAD_FAILED_EXTENSION_CATEGORY;
    case INSTALL_STARTED_ACTION:
      return isThemeType
        ? INSTALL_STARTED_THEME_CATEGORY
        : INSTALL_STARTED_EXTENSION_CATEGORY;
    case UNINSTALL_ACTION:
      return isThemeType
        ? UNINSTALL_THEME_CATEGORY
        : UNINSTALL_EXTENSION_CATEGORY;
    default:
      return isThemeType ? INSTALL_THEME_CATEGORY : INSTALL_EXTENSION_CATEGORY;
  }
};

// Singleton instance: every module that imports `tracking` shares this one
// instance, ensuring a single dataLayer and consistent tracking state.
export default (new Tracking(): Tracking);
