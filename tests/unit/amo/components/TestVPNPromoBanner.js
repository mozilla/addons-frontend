import * as React from 'react';

import VPNPromoBanner, {
  VPN_PROMO_CAMPAIGN,
  VPN_PROMO_CATEGORY,
  VPN_PROMO_CLICK_ACTION,
  VPN_PROMO_DISMISS_ACTION,
  VPN_PROMO_IMPRESSION_ACTION,
  VPN_URL,
  VPNPromoBannerBase,
} from 'amo/components/VPNPromoBanner';
import { DEFAULT_UTM_SOURCE, DEFAULT_UTM_MEDIUM } from 'amo/constants';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeLocation,
  createFakeTracking,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    // Enable the feature by default for all tests.
    _config = getFakeConfig({
      enableFeatureVPNPromo: true,
    }),
    _tracking = createFakeTracking(),
    location,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <VPNPromoBanner
        _config={_config}
        _tracking={_tracking}
        i18n={fakeI18n()}
        {...props}
      />,
      VPNPromoBannerBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  it('renders nothing when the feature is disabled', () => {
    const _config = getFakeConfig({ enableFeatureVPNPromo: false });

    const root = render({ _config });

    expect(root.find('.VPNPromoBanner')).toHaveLength(0);
  });

  it('renders a link with the expected href', () => {
    const queryString = [
      `utm_campaign=${VPN_PROMO_CAMPAIGN}`,
      `utm_medium=${DEFAULT_UTM_MEDIUM}`,
      `utm_source=${DEFAULT_UTM_SOURCE}`,
    ].join('&');
    const href = `${VPN_URL}?${queryString}`;

    const root = render();

    expect(root.find('.VPNPromoBanner-cta')).toHaveProp('href', href);
  });

  describe('tracking', () => {
    it('sends a tracking event when the cta is clicked', () => {
      const _tracking = createFakeTracking();

      const root = render({ _tracking });

      const event = createFakeEvent();
      root.find('.VPNPromoBanner-cta').simulate('click', event);

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_CLICK_ACTION,
        category: VPN_PROMO_CATEGORY,
      });
      // One event is the impression.
      sinon.assert.calledTwice(_tracking.sendEvent);
    });

    it('sends a tracking event when the dismiss button is clicked', () => {
      const _tracking = createFakeTracking();

      const root = render({ _tracking });

      const event = createFakeEvent();
      root.find('.VPNPromoBanner-dismisser-button').simulate('click', event);

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_DISMISS_ACTION,
        category: VPN_PROMO_CATEGORY,
      });
      // One event is the impression.
      sinon.assert.calledTwice(_tracking.sendEvent);
    });

    it('sends a tracking event for the impression on mount', () => {
      const _tracking = createFakeTracking();

      render({ _tracking });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
    });

    it('does not send a tracking event for the impression on mount when the feature is disabled', () => {
      const _config = getFakeConfig({ enableFeatureVPNPromo: false });
      const _tracking = createFakeTracking();

      render({ _config, _tracking });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('sends a tracking event for the impression on update', () => {
      const _tracking = createFakeTracking();
      const location = createFakeLocation({ pathname: '/a/' });

      const root = render({ _tracking, location });

      // Reset as the on mount impression would have been called.
      _tracking.sendEvent.resetHistory();

      root.setProps({ location: createFakeLocation({ pathname: '/b/' }) });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
    });

    it('does not send a tracking event for the impression on update when the feature is disabled', () => {
      const _config = getFakeConfig({ enableFeatureVPNPromo: false });
      const _tracking = createFakeTracking();
      const location = createFakeLocation({ pathname: '/a/' });

      const root = render({ _config, _tracking, location });

      root.setProps({ location: createFakeLocation({ pathname: '/b/' }) });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('does not send a tracking event for the impression on update if location has not changed', () => {
      const _tracking = createFakeTracking();
      const location = createFakeLocation({ pathname: '/a/' });

      const root = render({ _tracking, location });

      // Reset as the on mount impression would have been called.
      _tracking.sendEvent.resetHistory();

      root.setProps({ location });

      sinon.assert.notCalled(_tracking.sendEvent);
    });
  });
});
