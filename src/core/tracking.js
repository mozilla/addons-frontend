/* global window */
/* eslint-disable no-underscore-dangle */
import config from 'config';

import { convertBoolean } from 'core/utils';
import log from 'core/logger';
import {
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_INVALID,
  TRACKING_TYPE_THEME,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
} from 'core/constants';


export class Tracking {

  constructor({ trackingId, trackingEnabled, trackingSendInitPageView, _log = log } = {}) {
    if (typeof window === 'undefined') {
      /* istanbul ignore next */
      return;
    }
    this._log = _log;
    this.id = trackingId;
    this.enabled = trackingEnabled && trackingId;
    this.logPrefix = `[GA: ${this.enabled ? 'ON' : 'OFF'}]`;
    this.sendInitPageView = trackingSendInitPageView;

    if (this.enabled) {
      /* eslint-disable */
      // Snippet from Google UA docs: http://bit.ly/1O6Dsdh
      window.ga = window.ga || function() {(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
      ga('create', trackingId, 'auto');
      if (this.sendInitPageView) {
        ga('send', 'pageview');
      }
      /* eslint-enable */
    }

    this.log('Tracking init');
    if (!this.id) {
      this.log('Missing tracking id');
    }
  }

  log(...args) {
    this._log.info(this.logPrefix, ...args);
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
}

export function getAction(type) {
  return {
    [ADDON_TYPE_EXTENSION]: TRACKING_TYPE_EXTENSION,
    [ADDON_TYPE_THEME]: TRACKING_TYPE_THEME,
  }[type] || TRACKING_TYPE_INVALID;
}

export default new Tracking({
  trackingEnabled: convertBoolean(config.get('trackingEnabled')),
  trackingId: config.get('trackingId'),
  trackingSendInitPageView: config.get('trackingSendInitPageView'),
});
