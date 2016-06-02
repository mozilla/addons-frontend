/* eslint-disable no-underscore-dangle */

import config from 'config';
import log from 'core/logger';


export class Tracking {

  constructor(opts = {}) {
    this.id = opts.trackingId;
    this.enabled = opts.enabled;
    this.logPrefix = `[GA: ${this.enabled ? 'ON' : 'OFF'}]`;
    this.initialized = false;
  }

  _ga(args) {
    if (!this.initialized) {
      throw new Error('Must call init() first');
    } else {
      // eslint-disable-next-line no-undef
      ga.apply(window, [...args]);
    }
  }

  init() {
    /* istanbul ignore next */
    if (this.enabled === true) {
      log.info('Tracking init (Analytics is ON)');
      /*eslint-disable */
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
      ga('create', this.id, 'auto');
      ga('send', 'pageview');
      /*eslint-enable */
    } else {
      log.info('Tracking init. (Analytics is OFF)');
    }
    /* istanbul ignore next */
    this.initialized = true;
  }


 /*
  * Param           Type    Required  Description
  * opts.category   String  Yes       Typically the object that
  *                                   was interacted with (e.g. button)
  * opts.action     String  Yes       The type of interaction (e.g. click)
  * opts.label      String  No        Useful for categorizing events i
  *                                   (e.g. nav buttons)
  * opts.value      Number  No        Values must be non-negative.
  *                                   Useful to pass counts (e.g. 4 times)
  */
  sendEvent(opts) {
    if (!opts.category) {
      throw new Error('sendEvent: opts.category is required');
    }
    if (!opts.action) {
      throw new Error('sentEvent: opts.action is required');
    }
    if (this.enabled) {
      this._ga('send', {
        hitType: 'event',
        eventCategory: opts.category,
        eventAction: opts.action,
        eventLabel: opts.label,
        eventValue: opts.value,
      });
    }
    log.info(this.logPrefix, 'sendEvent', JSON.stringify(opts));
  }

 /*
  * Should be called when a new view is shown.
  * Used in a SPA when the url is changed.
  */
  setPage(page) {
    if (!page) {
      throw new Error('setPage: page is required');
    }
    if (this.enabled) {
      this._ga('set', 'page', page);
    }
    log.info(this.logPrefix, 'setPage', page);
  }
}

export default new Tracking({
  enabled: config.get('trackingEnabled'),
  trackingId: config.get('trackingId'),
});
