/* global navigator, window */
/* eslint-disable no-underscore-dangle */
import { oneLine } from 'common-tags';
import config from 'config';
import invariant from 'invariant';

import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  INSTALL_EXTENSION_CATEGORY,
  INSTALL_EXTENSION_STARTED_CATEGORY,
  INSTALL_STARTED_ACTION,
  INSTALL_THEME_CATEGORY,
  INSTALL_THEME_STARTED_CATEGORY,
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_INVALID,
  TRACKING_TYPE_STATIC_THEME,
  TRACKING_TYPE_THEME,
  UNINSTALL_ACTION,
  UNINSTALL_EXTENSION_CATEGORY,
  UNINSTALL_THEME_CATEGORY,
} from 'core/constants';
import log from 'core/logger';
import { convertBoolean, isTheme } from 'core/utils';

export function isDoNotTrackEnabled({
  _log = log,
  _navigator = typeof navigator !== 'undefined' ? navigator : null,
  _window = typeof window !== 'undefined' ? window : null,
} = {}) {
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

export class Tracking {
  constructor({
    _config = config,
    _isDoNotTrackEnabled = isDoNotTrackEnabled,
  } = {}) {
    if (typeof window === 'undefined') {
      /* istanbul ignore next */
      return;
    }
    this._log = log;
    this.logPrefix = '[GA]'; // this gets updated below
    this.id = _config.get('trackingId');

    if (!convertBoolean(_config.get('trackingEnabled'))) {
      this.log('Disabled because trackingEnabled was false');
      this.enabled = false;
    } else if (!this.id) {
      this.log('Disabled because trackingId was empty');
      this.enabled = false;
    } else if (_isDoNotTrackEnabled()) {
      this.log(oneLine`Do Not Track Enabled; Google Analytics not
        loaded and tracking disabled`);
      this.enabled = false;
    } else {
      this.log('Google Analytics is enabled');
      this.enabled = true;
    }

    this.logPrefix = `[GA: ${this.enabled ? 'ON' : 'OFF'}]`;

    if (this.enabled) {
      /* eslint-disable */
      // Snippet from Google UA docs: http://bit.ly/1O6Dsdh
      window.ga =
        window.ga ||
        function() {
          (ga.q = ga.q || []).push(arguments);
        };
      ga.l = +new Date();
      /* eslint-enable */
      ga('create', this.id, 'auto');
      if (convertBoolean(_config.get('trackingSendInitPageView'))) {
        ga('send', 'pageview');
      }
      // Set a custom dimension; this allows us to tell which front-end
      // (addons-frontend vs addons-server) is being used in analytics.
      ga('set', 'dimension3', 'addons-frontend');
    }
  }

  log(...args) {
    if (this._log) {
      this._log.info(this.logPrefix, ...args);
    }
  }

  _ga(...args) {
    if (this.enabled) {
      window.ga(...args);
    }
  }

  /*
  * Param          Type    Required  Description
  * obj.category   String  Yes       Typically the object that
  *                                  was interacted with (e.g. button)
  * obj.action     String  Yes       The type of interaction (e.g. click)
  * obj.label      String  No        Useful for categorizing events
  *                                  (e.g. nav buttons)
  * obj.value      Number  No        Values must be non-negative.
  *                                  Useful to pass counts (e.g. 4 times)
  */
  sendEvent({ category, action, label, value } = {}) {
    if (!category) {
      throw new Error('sendEvent: category is required');
    }
    if (!action) {
      throw new Error('sendEvent: action is required');
    }
    const data = {
      hitType: 'event',
      eventCategory: category,
      eventAction: action,
      eventLabel: label,
      eventValue: value,
    };
    this._ga('send', data);
    this.log('sendEvent', JSON.stringify(data));
  }

  /*
  * Should be called when a view changes or a routing update.
  */
  setPage(page) {
    if (!page) {
      throw new Error('setPage: page is required');
    }
    this._ga('set', 'page', page);
    this.log('setPage', page);
  }

  pageView(data = {}) {
    this._ga('send', 'pageview', data);
    this.log('pageView', JSON.stringify(data));
  }

  /*
  * Can be called to set a dimension which will be sent with all
  * subsequent calls to GA.
  */
  setDimension({ dimension, value }) {
    invariant(dimension, 'A dimension is required');
    invariant(value, 'A value is required');
    this._ga('set', dimension, value);
    this.log('set', { dimension, value });
  }
}

export function getAddonTypeForTracking(type) {
  return (
    {
      [ADDON_TYPE_DICT]: TRACKING_TYPE_EXTENSION,
      [ADDON_TYPE_EXTENSION]: TRACKING_TYPE_EXTENSION,
      [ADDON_TYPE_LANG]: TRACKING_TYPE_EXTENSION,
      [ADDON_TYPE_OPENSEARCH]: TRACKING_TYPE_EXTENSION,
      [ADDON_TYPE_STATIC_THEME]: TRACKING_TYPE_STATIC_THEME,
      [ADDON_TYPE_THEME]: TRACKING_TYPE_THEME,
    }[type] || TRACKING_TYPE_INVALID
  );
}

export const getAddonEventCategory = (type, installAction) => {
  const isThemeType = isTheme(type);

  switch (installAction) {
    case INSTALL_STARTED_ACTION:
      return isThemeType
        ? INSTALL_THEME_STARTED_CATEGORY
        : INSTALL_EXTENSION_STARTED_CATEGORY;
    case UNINSTALL_ACTION:
      return isThemeType
        ? UNINSTALL_THEME_CATEGORY
        : UNINSTALL_EXTENSION_CATEGORY;
    default:
      return isThemeType ? INSTALL_THEME_CATEGORY : INSTALL_EXTENSION_CATEGORY;
  }
};

export default new Tracking();
