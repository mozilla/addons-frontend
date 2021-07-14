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
import {
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DEFAULT_UTM_SOURCE,
  DEFAULT_UTM_MEDIUM,
} from 'amo/constants';
import {
  VARIANT_HIDE,
  VARIANT_SHOW,
} from 'amo/experiments/20210714_amo_vpn_promo';
import { NOT_IN_EXPERIMENT } from 'amo/withExperiment';
import {
  createContextWithFakeRouter,
  createFakeEvent,
  createFakeLocation,
  createFakeTracking,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({
    _tracking = createFakeTracking(),
    location,
    // Set up the component to show by default for all tests.
    variant = VARIANT_SHOW,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <VPNPromoBanner
        _tracking={_tracking}
        i18n={fakeI18n()}
        store={store}
        variant={variant}
        {...props}
      />,
      VPNPromoBannerBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  };

  const setupForComponent = ({
    clientApp = CLIENT_APP_FIREFOX,
    regionCode = 'US',
  } = {}) => {
    dispatchClientMetadata({ store, clientApp, regionCode });
  };

  // This validates that setupForComponent configures the component to display
  // by default.
  it('displays the promo on desktop, for an accepted region, with the show variant', () => {
    setupForComponent();
    const root = render();

    expect(root.find('.VPNPromoBanner')).toHaveLength(1);
  });

  it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
    'renders nothing when the variant is %s',
    (variant) => {
      setupForComponent();
      const root = render({ variant });

      expect(root.find('.VPNPromoBanner')).toHaveLength(0);
    },
  );

  it('renders nothing when the region should not be included', () => {
    setupForComponent({ regionCode: 'CN' });
    const root = render();

    expect(root.find('.VPNPromoBanner')).toHaveLength(0);
  });

  it('renders nothing on android', () => {
    setupForComponent({ clientApp: CLIENT_APP_ANDROID });
    const root = render();

    expect(root.find('.VPNPromoBanner')).toHaveLength(0);
  });

  it('renders a link with the expected href', () => {
    setupForComponent();
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
      setupForComponent();
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
      setupForComponent();
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
      setupForComponent();
      const _tracking = createFakeTracking();
      render({ _tracking });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
    });

    it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
      'does not send a tracking event for the impression on mount when the variant is %s',
      (variant) => {
        setupForComponent();
        const _tracking = createFakeTracking();
        render({ _tracking, variant });

        sinon.assert.notCalled(_tracking.sendEvent);
      },
    );

    it('does not send a tracking event for the impression on mount when the region should not be included', () => {
      setupForComponent({ regionCode: 'CN' });
      const _tracking = createFakeTracking();
      render({ _tracking });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('does not send a tracking event for the impression on mount on android', () => {
      setupForComponent({ clientApp: CLIENT_APP_ANDROID });
      const _tracking = createFakeTracking();
      render({ _tracking });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('sends a tracking event for the impression on update', () => {
      setupForComponent();
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

    it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
      'does not send a tracking event for the impression on update when the variant is %s',
      (variant) => {
        setupForComponent();
        const _tracking = createFakeTracking();
        const location = createFakeLocation({ pathname: '/a/' });
        const root = render({ _tracking, location, variant });

        root.setProps({ location: createFakeLocation({ pathname: '/b/' }) });

        sinon.assert.notCalled(_tracking.sendEvent);
      },
    );

    it('does not send a tracking event for the impression on update when the region should not be included', () => {
      setupForComponent({ regionCode: 'CN' });
      const _tracking = createFakeTracking();
      const location = createFakeLocation({ pathname: '/a/' });
      const root = render({ _tracking, location });

      root.setProps({ location: createFakeLocation({ pathname: '/b/' }) });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('does not send a tracking event for the impression on update on android', () => {
      setupForComponent({ clientApp: CLIENT_APP_ANDROID });
      const _tracking = createFakeTracking();
      const location = createFakeLocation({ pathname: '/a/' });
      const root = render({ _tracking, location });

      root.setProps({ location: createFakeLocation({ pathname: '/b/' }) });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('does not send a tracking event for the impression on update if location has not changed', () => {
      setupForComponent();
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
