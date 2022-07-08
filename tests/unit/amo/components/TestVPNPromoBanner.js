import * as React from 'react';
import { Route } from 'react-router-dom';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VPNPromoBanner, {
  IMPRESSION_COUNT_KEY,
  VPN_PROMO_CAMPAIGN,
  VPN_PROMO_CATEGORY,
  VPN_PROMO_CLICK_ACTION,
  VPN_PROMO_DISMISS_ACTION,
  VPN_PROMO_IMPRESSION_ACTION,
  VPN_URL,
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
  DEFAULT_LANG_IN_TESTS,
  changeLocation,
  createExperimentData,
  createFakeLocalStorage,
  createFakeTracking,
  dispatchClientMetadata,
  fakeAddon,
  fakeCookies,
  onLocationChanged,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let history;
  let store;
  const addonId = 123;
  const slug = 'some-slug';

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const createCookies = () => {
    return fakeCookies({
      get: jest.fn().mockReturnValue(
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
    lang = DEFAULT_LANG_IN_TESTS,
    location,
    regionCode = 'US',
    variant = VARIANT_SHOW,
    ...props
  } = {}) => {
    const addonPageLocation = `/${lang}/${clientApp}/addon/${slug}/`;
    dispatchClientMetadata({ store, clientApp, lang, regionCode });

    const renderOptions = {
      initialEntries: [location || addonPageLocation],
      store,
    };

    const renderResults = defaultRender(
      <Route path="/:lang/:application(firefox|android)/addon/:slug/">
        <VPNPromoBanner
          _tracking={createFakeTracking()}
          _localStorage={createFakeLocalStorage()}
          cookies={createCookies()}
          variant={variant}
          {...props}
        />
      </Route>,
      renderOptions,
    );

    history = renderResults.history;
    return renderResults;
  };

  // This validates that render configures the component to display by default.
  it('displays the promo on desktop, for an accepted region, with the show variant', () => {
    render();

    expect(
      screen.getByRole('link', { name: 'Get Mozilla VPN' }),
    ).toBeInTheDocument();
  });

  it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
    'does not display the promo when the variant is %s',
    (variant) => {
      render({ variant });

      expect(
        screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
      ).not.toBeInTheDocument();
    },
  );

  it('does not display the promo when the region should not be included', () => {
    render({ regionCode: 'CN' });

    expect(
      screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
    ).not.toBeInTheDocument();
  });

  it('does not display the promo on android', () => {
    render({ clientApp: CLIENT_APP_ANDROID });

    expect(
      screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
    ).not.toBeInTheDocument();
  });

  it('renders a link with the expected href without an add-on loaded', () => {
    const queryString = [
      `utm_campaign=${VPN_PROMO_CAMPAIGN}`,
      `utm_medium=${DEFAULT_UTM_MEDIUM}`,
      `utm_source=${DEFAULT_UTM_SOURCE}`,
    ].join('&');
    const href = `${VPN_URL}?${queryString}`;

    render();

    expect(
      screen.getByRole('link', { name: 'Get Mozilla VPN' }),
    ).toHaveAttribute('href', href);
  });

  it('renders a link with the expected href with an add-on loaded', () => {
    const queryString = [
      `utm_campaign=${VPN_PROMO_CAMPAIGN}`,
      `utm_content=${addonId}`,
      `utm_medium=${DEFAULT_UTM_MEDIUM}`,
      `utm_source=${DEFAULT_UTM_SOURCE}`,
    ].join('&');
    const href = `${VPN_URL}?${queryString}`;

    store.dispatch(
      loadAddon({ addon: { ...fakeAddon, id: addonId, slug }, slug }),
    );
    render();

    expect(
      screen.getByRole('link', { name: 'Get Mozilla VPN' }),
    ).toHaveAttribute('href', href);
  });

  const clickCta = () => {
    userEvent.click(screen.getByRole('link', { name: 'Get Mozilla VPN' }));
  };

  const clickDismiss = () => {
    userEvent.click(screen.getByRole('button'));
  };

  it('clears the impression count when the cta is clicked', () => {
    const _localStorage = createFakeLocalStorage();
    render({ _localStorage });
    clickCta();

    expect(_localStorage.removeItem).toHaveBeenCalledWith(IMPRESSION_COUNT_KEY);
  });

  it('reads and updates the experiment cookie when the cta is clicked', () => {
    const cookies = createCookies();
    render({ cookies });
    clickCta();

    expect(cookies.get).toHaveBeenCalledWith(EXPERIMENT_COOKIE_NAME);
    expect(cookies.set).toHaveBeenCalledWith(
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({
        id: EXPERIMENT_CONFIG.id,
        variantId: NOT_IN_EXPERIMENT,
      }),
      defaultCookieConfig,
    );
  });

  it('hides itself when the cta is clicked', async () => {
    render();

    expect(
      screen.getByRole('link', { name: 'Get Mozilla VPN' }),
    ).toBeInTheDocument();

    clickCta();

    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('clears the impression count when the dismiss button is clicked', () => {
    const _localStorage = createFakeLocalStorage();
    render({ _localStorage });
    clickDismiss();

    expect(_localStorage.removeItem).toHaveBeenCalledWith(IMPRESSION_COUNT_KEY);
  });

  it('reads and updates the experiment cookie when the dismiss button is clicked', () => {
    const cookies = createCookies();
    render({ cookies });
    clickDismiss();

    expect(cookies.get).toHaveBeenCalledWith(EXPERIMENT_COOKIE_NAME);
    expect(cookies.set).toHaveBeenCalledWith(
      EXPERIMENT_COOKIE_NAME,
      createExperimentData({
        id: EXPERIMENT_CONFIG.id,
        variantId: NOT_IN_EXPERIMENT,
      }),
      defaultCookieConfig,
    );
  });

  it('hides itself when the dismiss button is clicked', async () => {
    render();

    expect(
      screen.getByRole('link', { name: 'Get Mozilla VPN' }),
    ).toBeInTheDocument();

    clickDismiss();

    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('throws an exception if something other than a number is stored', () => {
    const _localStorage = createFakeLocalStorage({
      getItem: jest.fn().mockReturnValue('not a number!'),
    });

    expect(() => {
      render({ _localStorage });
    }).toThrowError(/A non-number was stored in VPNPromoImpressionCount/);
  });

  describe('tracking', () => {
    it('sends a tracking event when the cta is clicked', () => {
      const impressionCount = '5';
      const _localStorage = createFakeLocalStorage({
        getItem: jest.fn().mockReturnValue(impressionCount),
      });
      const _tracking = createFakeTracking();
      render({ _tracking, _localStorage });
      _tracking.sendEvent.mockClear();
      clickCta();

      expect(_tracking.sendEvent).toHaveBeenCalledWith({
        action: VPN_PROMO_CLICK_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: impressionCount,
      });
      expect(_tracking.sendEvent).toHaveBeenCalledTimes(1);
    });

    it('sends a tracking event when the dismiss button is clicked', () => {
      const impressionCount = '5';
      const _localStorage = createFakeLocalStorage({
        getItem: jest.fn().mockReturnValue(impressionCount),
      });
      const _tracking = createFakeTracking();
      render({ _tracking, _localStorage });
      _tracking.sendEvent.mockClear();
      clickDismiss();

      expect(_tracking.sendEvent).toHaveBeenCalledWith({
        action: VPN_PROMO_DISMISS_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: impressionCount,
      });
      expect(_tracking.sendEvent).toHaveBeenCalledTimes(1);
    });

    it('sends a tracking event and increases the count for the impression on mount', () => {
      const impressionCount = '5';
      const nextImpressionCount = 6;
      const _localStorage = createFakeLocalStorage({
        getItem: jest.fn().mockReturnValue(impressionCount),
      });
      const _tracking = createFakeTracking();
      render({ _tracking, _localStorage });

      expect(_tracking.sendEvent).toHaveBeenCalledWith({
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: String(nextImpressionCount),
      });
      expect(_tracking.sendEvent).toHaveBeenCalledTimes(1);
      expect(_localStorage.setItem).toHaveBeenCalledWith(
        IMPRESSION_COUNT_KEY,
        nextImpressionCount,
      );
    });

    it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
      'does not send a tracking event for the impression on mount when the variant is %s',
      (variant) => {
        const _tracking = createFakeTracking();
        render({ _tracking, variant });

        expect(_tracking.sendEvent).not.toHaveBeenCalled();
      },
    );

    it('does not send a tracking event for the impression on mount when the region should not be included', () => {
      const _tracking = createFakeTracking();
      render({ _tracking, regionCode: 'CN' });

      expect(_tracking.sendEvent).not.toHaveBeenCalled();
    });

    it('does not send a tracking event for the impression on mount on android', () => {
      const _tracking = createFakeTracking();
      render({ _tracking, clientApp: CLIENT_APP_ANDROID });

      expect(_tracking.sendEvent).not.toHaveBeenCalled();
    });

    it('sends a tracking event and increases the count for the impression on update', async () => {
      const impressionCount = '5';
      const nextImpressionCount = 6;
      const _localStorage = createFakeLocalStorage({
        getItem: jest.fn().mockReturnValue(impressionCount),
      });
      const _tracking = createFakeTracking();
      render({ _tracking, _localStorage });

      // Reset as the on mount impression would have been called.
      _tracking.sendEvent.mockClear();

      await changeLocation({
        history,
        pathname: `/en-US/firefox/addon/${slug}-new/`,
      });

      expect(_tracking.sendEvent).toHaveBeenCalledWith({
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: String(nextImpressionCount),
      });
      expect(_tracking.sendEvent).toHaveBeenCalledTimes(1);

      expect(_localStorage.setItem).toHaveBeenCalledWith(
        IMPRESSION_COUNT_KEY,
        nextImpressionCount,
      );
    });

    it.each([VARIANT_HIDE, NOT_IN_EXPERIMENT, null])(
      'does not send a tracking event for the impression on update when the variant is %s',
      (variant) => {
        const _tracking = createFakeTracking();
        render({ _tracking, variant });

        store.dispatch(
          onLocationChanged({
            pathname: `/en-US/firefox/addon/${slug}-new/`,
          }),
        );

        expect(_tracking.sendEvent).not.toHaveBeenCalled();
      },
    );

    it('does not send a tracking event for the impression on update when the region should not be included', () => {
      const _tracking = createFakeTracking();
      render({ _tracking, regionCode: 'CN' });

      store.dispatch(
        onLocationChanged({
          pathname: `/en-US/firefox/addon/${slug}-new/`,
        }),
      );

      expect(_tracking.sendEvent).not.toHaveBeenCalled();
    });

    it('does not send a tracking event for the impression on update on android', () => {
      const _tracking = createFakeTracking();
      render({
        _tracking,
        clientApp: CLIENT_APP_ANDROID,
      });

      store.dispatch(
        onLocationChanged({
          pathname: `/en-US/firefox/addon/${slug}-new/`,
        }),
      );

      expect(_tracking.sendEvent).not.toHaveBeenCalled();
    });

    it('does not send a tracking event for the impression on update if location has not changed', () => {
      const _tracking = createFakeTracking();
      const location = `/en-US/firefox/addon/${slug}/`;
      render({ _tracking, location });

      // Reset as the on mount impression would have been called.
      _tracking.sendEvent.mockClear();

      store.dispatch(onLocationChanged({ pathname: location }));

      expect(_tracking.sendEvent).not.toHaveBeenCalled();
    });
  });
});
