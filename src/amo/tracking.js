/* @flow */
/* global navigator, window */
import { oneLine } from 'common-tags';
import config from 'config';
import invariant from 'invariant';
import { getCLS, getFID, getLCP } from 'web-vitals';

import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
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
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_INVALID,
  TRACKING_TYPE_STATIC_THEME,
  UNINSTALL_ACTION,
  UNINSTALL_EXTENSION_CATEGORY,
  UNINSTALL_THEME_CATEGORY,
} from 'amo/constants';
import log from 'amo/logger';
import { convertBoolean } from 'amo/utils';

type MakeTrackingEventDataParams = {|
  action: string,
  category: string,
  label?: string,
  value?: number,
|};

export type SendTrackingEventParams = {|
  _config?: typeof config,
  sendSecondEventWithOverrides?: Object,
  ...MakeTrackingEventDataParams,
|};

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
  _getCLS: typeof getCLS,
  _getFID: typeof getFID,
  _getLCP: typeof getLCP,
};

const makeTrackingEventData = ({
  action,
  category,
  label,
  value,
}: MakeTrackingEventDataParams) => {
  return {
    eventAction: action,
    eventCategory: category,
    eventLabel: label,
    eventValue: value,
    hitType: 'event',
  };
};

export class Tracking {
  _log: typeof log;

  logPrefix: string;

  trackingEnabled: boolean;

  sendWebVitals: boolean;

  // Tracking IDs for UA and GA4
  id: string;

  ga4Id: string;

  constructor({
    _config = config,
    _isDoNotTrackEnabled = isDoNotTrackEnabled,
    _getCLS = getCLS,
    _getFID = getFID,
    _getLCP = getLCP,
  }: TrackingParams = {}) {
    if (typeof window === 'undefined') {
      return;
    }

    this._log = log;
    this.logPrefix = '[GA]'; // this gets updated below
    this.id = _config.get('trackingId');
    this.ga4Id = _config.get('ga4PropertyId');

    if (!convertBoolean(_config.get('trackingEnabled'))) {
      this.log('GA disabled because trackingEnabled was false');
      this.trackingEnabled = false;
    } else if (!this.id && !this.ga4Id) {
      this.log('GA Disabled because UA and GA4 trackingIds are empty');
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
      // Create a Flow typed variable for `ga`.
      declare var ga: {|
        q: Array<string>,
        l: number,
        (string, string, ?string): void,
      |};

      /* eslint-disable */
      // Snippet from Google UA docs: http://bit.ly/1O6Dsdh
      window.ga =
        window.ga ||
        function () {
          (ga.q = ga.q || []).push(arguments);
        };
      ga.l = +new Date();
      /* eslint-enable */
      ga('create', this.id, 'auto');
      ga('set', 'transport', 'beacon');
      if (convertBoolean(_config.get('trackingSendInitPageView'))) {
        ga('send', 'pageview');
      }
      // Set a custom dimension; this allows us to tell which front-end
      // (addons-frontend vs addons-server) is being used in analytics.
      ga('set', 'dimension3', 'addons-frontend');

      if (convertBoolean(_config.get('trackingSendWebVitals'))) {
        this.log('trackingSendWebVitals is enabled');

        // $FlowFixMe: Deal with method-unbinding error.
        const sendWebVitalStats = this.sendWebVitalStats.bind(this);
        _getCLS(sendWebVitalStats);
        _getFID(sendWebVitalStats);
        _getLCP(sendWebVitalStats);
      }

      // GA4 setup
      window.dataLayer = window.dataLayer || [];
      const extraConfig = _config.get('ga4DebugMode')
        ? { debug_mode: true }
        : {};
      // $FlowIgnore
      this._ga4('js', new Date());
      // $FlowIgnore
      this._ga4('config', this.ga4Id, extraConfig);
    }
  }

  sendWebVitalStats({
    delta,
    id,
    name,
    value,
  }: {|
    delta: number,
    id: number,
    name: string,
    value: number,
  |}) {
    this.log('sendWebVitalStats', { delta, id, name, value });

    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    const adjustedDelta = Math.round(name === 'CLS' ? delta * 1000 : delta);

    this._ga('send', 'event', {
      eventCategory: 'Web Vitals',
      eventAction: name,
      // The `id` value will be unique to the current page load. When sending
      // multiple values from the same page (e.g. for CLS), Google Analytics
      // can compute a total by grouping on this ID (note: requires
      // `eventLabel` to be a dimension in your report).
      eventLabel: id,
      eventValue: adjustedDelta,
      // Use a non-interaction event to avoid affecting bounce rate.
      nonInteraction: true,
      // Use `sendBeacon()` if the browser supports it.
      transport: 'beacon',
    });

    // Also send to GA4.
    // See https://github.com/GoogleChrome/web-vitals#using-gtagjs-google-analytics-4
    // $FlowIgnore
    this._ga4('event', name, {
      value: adjustedDelta,
      metric_id: id,
      metric_value: value,
      metric_delta: adjustedDelta,
    });
  }

  log(message: string, obj?: Object) {
    if (this._log) {
      const pattern = typeof obj === 'undefined' ? '%s %s' : '%s %s: %o';
      // eslint-disable-next-line amo/only-log-strings
      this._log.info(pattern, this.logPrefix, message, obj);
    }
  }

  _ga(...args: Array<mixed>) {
    if (this.trackingEnabled) {
      window.ga(...args);
    }
  }

  _ga4() {
    if (this.trackingEnabled) {
      /* eslint-disable */
      // $FlowIgnore
      dataLayer.push(arguments);
      /* eslint-enable */
    }
  }

  /*
   * Param                            Type    Required  Description
   * obj.action                       String  Yes       The type of interaction
   *                                                    (e.g. click)
   * obj.category                     String  Yes       Typically the object
   *                                                    that was interacted
   *                                                    with (e.g. button)
   * obj.label                        String  No        Useful for categorizing
   *                                                    events (e.g. nav
   *                                                    buttons)
   * obj.sendSecondEventWithOverrides Object  No        If passed, an extra
   *                                                    event will be sent
   *                                                    using the object's
   *                                                    properties as overrides
   * obj.value      Number  No                          Values must be
   *                                                    non-negative.
   *                                                    Useful to pass counts
   *                                                    (e.g. 4 times)
   */
  sendEvent({
    _config = config,
    action,
    category,
    label,
    sendSecondEventWithOverrides,
    value,
  }: SendTrackingEventParams) {
    if (!category) {
      throw new Error('sendEvent: category is required');
    }
    if (!action) {
      throw new Error('sendEvent: action is required');
    }

    if (_config.get('server')) {
      // It is not possible to send GA events from the server, but a developer
      // might call this function from code that executes on the server. This
      // exception will act as a warning that the code should be altered or
      // moved.
      throw new Error('sendEvent: cannot send tracking events on the server');
    } else {
      const trackingData = { action, category, label, value };
      const data = makeTrackingEventData(trackingData);
      this._ga('send', data);
      // Also send the event to GA4
      // $FlowIgnore
      this._ga4('event', data.eventCategory, data);
      this.log('sendEvent', data);

      if (typeof sendSecondEventWithOverrides === 'object') {
        const secondEventData = makeTrackingEventData({
          ...trackingData,
          ...sendSecondEventWithOverrides,
        });
        this._ga('send', secondEventData);
        // Also send the event to GA4
        // $FlowIgnore
        this._ga4('event', secondEventData.eventCategory, secondEventData);
        this.log('sendEvent', secondEventData);
      }
    }
  }

  /*
   * Should be called when a view changes or a routing update.
   * This is not needed by GA4.
   */
  setPage(page: string) {
    if (!page) {
      throw new Error('setPage: page is required');
    }
    this._ga('set', 'page', page);
    this.log('setPage', page);
  }

  pageView(data: Object = {}) {
    // See: https://developers.google.com/analytics/devguides/collection/analyticsjs/pages#pageview_fields
    this._ga('send', { hitType: 'pageview', ...data });
    this.log('pageView', data);
  }

  /*
   * Can be called to set a dimension which will be sent with all subsequent
   * calls to GA.
   */
  setDimension({ dimension, value }: {| dimension: string, value: string |}) {
    invariant(dimension, 'A dimension is required');
    invariant(value, 'A value is required');

    this._ga('set', dimension, value);
    this.log('set', { dimension, value });
  }

  /*
   * Can be called to set user properties which will be sent with all subsequent
   * calls to GA4.
   */
  setUserProperties(props: { [string]: string }) {
    // $FlowIgnore
    this._ga4('set', 'user_properties', props);
    this.log('setUserProperties', props);
  }
}

export function getAddonTypeForTracking(type: string): string {
  return (
    {
      [ADDON_TYPE_DICT]: TRACKING_TYPE_EXTENSION,
      [ADDON_TYPE_EXTENSION]: TRACKING_TYPE_EXTENSION,
      [ADDON_TYPE_LANG]: TRACKING_TYPE_EXTENSION,
      [ADDON_TYPE_STATIC_THEME]: TRACKING_TYPE_STATIC_THEME,
    }[type] || TRACKING_TYPE_INVALID
  );
}

export const getAddonEventCategory = (
  type: string,
  installAction: string,
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

export default (new Tracking(): Tracking);
