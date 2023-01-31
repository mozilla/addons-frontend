import config from 'config';
import * as React from 'react';

import Page from 'amo/components/Page';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  EXPERIMENT_CONFIG,
  VARIANT_SHOW,
} from 'amo/experiments/20210714_amo_vpn_promo';
import {
  DEFAULT_LANG_IN_TESTS,
  createExperimentCookie,
  dispatchClientMetadata,
  getMockConfig,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

// We need to control the config, which is used by withExperiment, but we are
// rendering the Page component, so we have to control it via mocking as
// opposed to injecting a _config prop.
jest.mock('config');

// We need this to avoid firing sendEvent during tests, which will throw.
jest.mock('amo/tracking', () => ({
  sendEvent: jest.fn(),
  setDimension: jest.fn(),
  setUserProperties: jest.fn(),
}));

describe(__filename, () => {
  let fakeConfig;
  let store;

  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });

  beforeEach(() => {
    store = dispatchClientMetadata().store;
    fakeConfig = getMockConfig({
      // We need to make sure the experiment is enabled in order for the banner
      // to appear on the page.
      experiments: {
        [EXPERIMENT_CONFIG.id]: true,
      },
    });
  });

  const render = ({
    clientApp = CLIENT_APP_FIREFOX,
    lang = DEFAULT_LANG_IN_TESTS,
    regionCode = 'US',
    variant = VARIANT_SHOW,
    ...props
  } = {}) => {
    config.get.mockImplementation((key) => {
      return fakeConfig[key];
    });
    dispatchClientMetadata({ store, clientApp, lang, regionCode });
    createExperimentCookie({ experimentId: EXPERIMENT_CONFIG.id, variant });

    return defaultRender(<Page {...props} />, { store });
  };

  it('renders a VPNPromoBanner if showVPNPromo is true and the feature is enabled', () => {
    fakeConfig = { ...fakeConfig, enableFeatureVPNPromo: true };
    render({ showVPNPromo: true, variant: VARIANT_SHOW });

    expect(
      screen.getByRole('link', { name: 'Get Mozilla VPN' }),
    ).toBeInTheDocument();
  });

  it('does not render a VPNPromoBanner if showVPNPromo is false', () => {
    fakeConfig = { ...fakeConfig, enableFeatureVPNPromo: true };
    render({ showVPNPromo: false });

    expect(
      screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
    ).not.toBeInTheDocument();
  });

  it('does not render a VPNPromoBanner if the feature is disabled', () => {
    fakeConfig = { ...fakeConfig, enableFeatureVPNPromo: false };
    render({ showVPNPromo: true, variant: VARIANT_SHOW });

    expect(
      screen.queryByRole('link', { name: 'Get Mozilla VPN' }),
    ).not.toBeInTheDocument();
  });
});
