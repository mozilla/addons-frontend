import * as React from 'react';

import VPNPromoBanner, {
  IMPRESSION_COUNT_KEY,
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
  EXPERIMENT_CONFIG,
  VARIANT_HIDE,
  VARIANT_SHOW,
} from 'amo/experiments/20210714_amo_vpn_promo';
import { loadAddon } from 'amo/reducers/addons';
import {
  EXPERIMENT_COOKIE_NAME,
  NOT_IN_EXPERIMENT,
  defaultCookieConfig,
} from 'amo/withExperiment';
import {
  createContextWithFakeRouter,
  createExperimentData,
  createFakeEvent,
  createFakeLocalStorage,
  createFakeLocation,
  createFakeTracking,
  dispatchClientMetadata,
  fakeAddon,
  fakeCookies,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const createCookies = () => {
    return fakeCookies({
      get: sinon.stub().returns(
        createExperimentData({
          id: EXPERIMENT_CONFIG.id,
          variantId: VARIANT_SHOW,
        }),
      ),
    });
  };

  const render = ({
    // The defaults for clientApp, regionCode and variant set up the component
    // to show by default for all tests.
    clientApp = CLIENT_APP_FIREFOX,
    location,
    match = {
      params: {
        slug: 'some-slug',
      },
    },
    regionCode = 'US',
    variant = VARIANT_SHOW,
    ...props
  } = {}) => {
    dispatchClientMetadata({ store, clientApp, regionCode });
    return shallowUntilTarget(
      <VPNPromoBanner
        _tracking={createFakeTracking()}
        _localStorage={createFakeLocalStorage()}
        cookies={createCookies()}
        i18n={fakeI18n()}
        store={store}
        variant={variant}
        {...props}
      />,
      VPNPromoBannerBase,
      {
        shallowOptions: createContextWithFakeRouter({ location, match }),
      },
    );
  };

  // This validates that render configures the component to display by default.
  it('displays the promo on desktop, for an accepted region, with the show variant', () => {
    const root = render();

    expect(root.find('.VPNPromoBanner')).toHaveLength(1);
  });

  it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
    'renders nothing when the variant is %s',
    (variant) => {
      const root = render({ variant });

      expect(root.find('.VPNPromoBanner')).toHaveLength(0);
    },
  );

  it('renders nothing when the region should not be included', () => {
    const root = render({ regionCode: 'CN' });

    expect(root.find('.VPNPromoBanner')).toHaveLength(0);
  });

  it('renders nothing on android', () => {
    const root = render({ clientApp: CLIENT_APP_ANDROID });

    expect(root.find('.VPNPromoBanner')).toHaveLength(0);
  });

  it('renders a link with the expected href without an add-on loaded', () => {
    const queryString = [
      `utm_campaign=${VPN_PROMO_CAMPAIGN}`,
      `utm_medium=${DEFAULT_UTM_MEDIUM}`,
      `utm_source=${DEFAULT_UTM_SOURCE}`,
    ].join('&');
    const href = `${VPN_URL}?${queryString}`;

    const root = render();

    expect(root.find('.VPNPromoBanner-cta')).toHaveProp('href', href);
  });

  it('renders a link with the expected href with an add-on loaded', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };
    const queryString = [
      `utm_campaign=${VPN_PROMO_CAMPAIGN}`,
      `utm_content=${addon.id}`,
      `utm_medium=${DEFAULT_UTM_MEDIUM}`,
      `utm_source=${DEFAULT_UTM_SOURCE}`,
    ].join('&');
    const href = `${VPN_URL}?${queryString}`;

    store.dispatch(loadAddon({ addon, slug }));

    const root = render({ match: { params: { slug } } });

    expect(root.find('.VPNPromoBanner-cta')).toHaveProp('href', href);
  });

  const clickCta = (root) => {
    root.find('.VPNPromoBanner-cta').simulate('click', createFakeEvent());
  };

  const clickDismiss = (root) => {
    root
      .find('.VPNPromoBanner-dismisser-button')
      .simulate('click', createFakeEvent());
  };

  it('clears the impression count when the cta is clicked', () => {
    const _localStorage = createFakeLocalStorage();

    const root = render({ _localStorage });
    clickCta(root);

    sinon.assert.calledWith(_localStorage.removeItem, IMPRESSION_COUNT_KEY);
  });

  it('reads and updates the experiment cookie when the cta is clicked', () => {
    const cookies = createCookies();
    const root = render({ cookies });
    clickCta(root);

    sinon.assert.calledWith(cookies.get, EXPERIMENT_COOKIE_NAME);
    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({
        id: EXPERIMENT_CONFIG.id,
        variantId: NOT_IN_EXPERIMENT,
      }),
      defaultCookieConfig,
    );
  });

  it('hides itself when the cta is clicked', () => {
    const root = render();
    clickCta(root);

    expect(root.find('.VPNPromoBanner')).toHaveLength(0);
  });

  it('clears the impression count when the dismiss button is clicked', () => {
    const _localStorage = createFakeLocalStorage();

    const root = render({ _localStorage });
    clickDismiss(root);

    sinon.assert.calledWith(_localStorage.removeItem, IMPRESSION_COUNT_KEY);
  });

  it('reads and updates the experiment cookie when the dismiss button is clicked', () => {
    const cookies = createCookies();
    const root = render({ cookies });
    clickDismiss(root);

    sinon.assert.calledWith(cookies.get, EXPERIMENT_COOKIE_NAME);
    sinon.assert.calledWith(
      cookies.set,
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({
        id: EXPERIMENT_CONFIG.id,
        variantId: NOT_IN_EXPERIMENT,
      }),
      defaultCookieConfig,
    );
  });

  it('hides itself when the dismiss button is clicked', () => {
    const root = render();
    clickDismiss(root);

    expect(root.find('.VPNPromoBanner')).toHaveLength(0);
  });

  it('throws an exception if something other than a number is stored', () => {
    const _localStorage = createFakeLocalStorage({
      getItem: sinon.stub().returns('not a number!'),
    });

    expect(() => {
      render({ _localStorage });
    }).toThrowError(/A non-number was stored in VPNPromoImpressionCount/);
  });

  describe('tracking', () => {
    it('sends a tracking event when the cta is clicked', () => {
      const impressionCount = '5';
      const _localStorage = createFakeLocalStorage({
        getItem: sinon.stub().returns(impressionCount),
      });
      const _tracking = createFakeTracking();
      const root = render({ _tracking, _localStorage });
      root.find('.VPNPromoBanner-cta').simulate('click', createFakeEvent());

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_CLICK_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: impressionCount,
      });
      // One event is the impression.
      sinon.assert.calledTwice(_tracking.sendEvent);
    });

    it('sends a tracking event when the dismiss button is clicked', () => {
      const impressionCount = '5';
      const _localStorage = createFakeLocalStorage({
        getItem: sinon.stub().returns(impressionCount),
      });
      const _tracking = createFakeTracking();
      const root = render({ _tracking, _localStorage });
      root
        .find('.VPNPromoBanner-dismisser-button')
        .simulate('click', createFakeEvent());

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_DISMISS_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: impressionCount,
      });
      // One event is the impression.
      sinon.assert.calledTwice(_tracking.sendEvent);
    });

    it('sends a tracking event and increases the count for the impression on mount', () => {
      const impressionCount = '5';
      const nextImpressionCount = 6;
      const _localStorage = createFakeLocalStorage({
        getItem: sinon.stub().returns(impressionCount),
      });
      const _tracking = createFakeTracking();
      render({ _tracking, _localStorage });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: String(nextImpressionCount),
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
      sinon.assert.calledWith(
        _localStorage.setItem,
        IMPRESSION_COUNT_KEY,
        nextImpressionCount,
      );
    });

    it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
      'does not send a tracking event for the impression on mount when the variant is %s',
      (variant) => {
        const _tracking = createFakeTracking();
        render({ _tracking, variant });

        sinon.assert.notCalled(_tracking.sendEvent);
      },
    );

    it('does not send a tracking event for the impression on mount when the region should not be included', () => {
      const _tracking = createFakeTracking();
      render({ _tracking, regionCode: 'CN' });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('does not send a tracking event for the impression on mount on android', () => {
      const _tracking = createFakeTracking();
      render({ _tracking, clientApp: CLIENT_APP_ANDROID });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('sends a tracking event and increases the count for the impression on update', () => {
      const impressionCount = '5';
      const nextImpressionCount = 6;
      const _localStorage = createFakeLocalStorage({
        getItem: sinon.stub().returns(impressionCount),
      });
      const _tracking = createFakeTracking();
      const location = createFakeLocation({ pathname: '/a/' });
      const root = render({ _tracking, _localStorage, location });

      // Reset as the on mount impression would have been called.
      _tracking.sendEvent.resetHistory();

      root.setProps({ location: createFakeLocation({ pathname: '/b/' }) });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: String(nextImpressionCount),
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
      sinon.assert.calledWith(
        _localStorage.setItem,
        IMPRESSION_COUNT_KEY,
        nextImpressionCount,
      );
    });

    it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
      'does not send a tracking event for the impression on update when the variant is %s',
      (variant) => {
        const _tracking = createFakeTracking();
        const location = createFakeLocation({ pathname: '/a/' });
        const root = render({ _tracking, location, variant });

        root.setProps({ location: createFakeLocation({ pathname: '/b/' }) });

        sinon.assert.notCalled(_tracking.sendEvent);
      },
    );

    it('does not send a tracking event for the impression on update when the region should not be included', () => {
      const _tracking = createFakeTracking();
      const location = createFakeLocation({ pathname: '/a/' });
      const root = render({ _tracking, location, regionCode: 'CN' });

      root.setProps({ location: createFakeLocation({ pathname: '/b/' }) });

      sinon.assert.notCalled(_tracking.sendEvent);
    });

    it('does not send a tracking event for the impression on update on android', () => {
      const _tracking = createFakeTracking();
      const location = createFakeLocation({ pathname: '/a/' });
      const root = render({
        _tracking,
        clientApp: CLIENT_APP_ANDROID,
        location,
      });

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
