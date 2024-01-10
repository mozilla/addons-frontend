/* @flow */
/* global window */
import invariant from 'invariant';
import * as React from 'react';
import { withCookies, Cookies } from 'react-cookie';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import Button from 'amo/components/Button';
import {
  EXPERIMENT_CONFIG,
  VARIANT_SHOW,
  shouldExcludeUser,
} from 'amo/experiments/20210714_amo_vpn_promo';
import translate from 'amo/i18n/translate';
import { getAddonByIdInURL } from 'amo/reducers/addons';
import tracking from 'amo/tracking';
import { makeQueryStringWithUTM } from 'amo/utils';
import {
  EXPERIMENT_COOKIE_NAME,
  NOT_IN_EXPERIMENT,
  defaultCookieConfig,
} from 'amo/withExperiment';
import type { RegionCodeType } from 'amo/reducers/api';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'amo/types/router';

import './styles.scss';
import vpnLogo from './img/mozilla-vpn.svg';
import dismissX from './img/x-close-black.svg';

export const IMPRESSION_COUNT_KEY = 'VPNPromoImpressionCount';
export const VPN_PROMO_CAMPAIGN = 'amo-vpn-promo';
export const VPN_PROMO_CATEGORY = 'VPN Promo Banner';
export const VPN_PROMO_CLICK_ACTION = 'vpn-promo-banner-click';
export const VPN_PROMO_DISMISS_ACTION = 'vpn-promo-banner-dismiss';
export const VPN_PROMO_IMPRESSION_ACTION = 'vpn-promo-banner-impression';
export const VPN_URL = 'https://www.mozilla.org/products/vpn';

export type Props = {| variant: string | null |};

export type DefaultProps = {|
  _tracking: typeof tracking,
  _localStorage: typeof window.localStorage | Object,
|};

type PropsFromState = {|
  addonIdentifier: string | null,
  clientApp: string,
  regionCode: RegionCodeType,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  ...PropsFromState,
  cookies: typeof Cookies,
  i18n: I18nType,
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {
      slug: string,
    },
  |},
|};

export const getImpressionCount = (
  _localStorage: typeof window.localStorage,
): number => {
  const impressionCount = _localStorage.getItem(IMPRESSION_COUNT_KEY);
  const parsedCount = parseInt(impressionCount || 0, 10);

  invariant(
    !Number.isNaN(parsedCount),
    `A non-number was stored in ${IMPRESSION_COUNT_KEY}: ${impressionCount}`,
  );

  return parsedCount;
};

type State = {|
  dismissed: boolean,
|};

export class VPNPromoBannerBase extends React.Component<InternalProps, State> {
  static defaultProps: DefaultProps = {
    _tracking: tracking,
    _localStorage: typeof window !== 'undefined' ? window.localStorage : {},
  };

  constructor(props: InternalProps) {
    super(props);

    this.state = { dismissed: props.variant !== VARIANT_SHOW };
  }

  shouldShowBanner(): boolean {
    const { clientApp, regionCode, variant } = this.props;

    return (
      variant === VARIANT_SHOW &&
      !this.state.dismissed &&
      !shouldExcludeUser({
        clientApp,
        regionCode,
      })
    );
  }

  onInteract: (action: string) => void = (action) => {
    const { _tracking, _localStorage, cookies } = this.props;

    const impressionCount = getImpressionCount(_localStorage);
    _tracking.sendEvent({
      action,
      category: VPN_PROMO_CATEGORY,
      label: String(impressionCount),
    });
    _localStorage.removeItem(IMPRESSION_COUNT_KEY);
    this.setState({ dismissed: true });

    // See https://github.com/mozilla/addons-frontend/issues/10770
    const experiments = cookies.get(EXPERIMENT_COOKIE_NAME);
    experiments[EXPERIMENT_CONFIG.id] = NOT_IN_EXPERIMENT;
    // We can use defaultCookieConfig because our experiment does not define a
    // cookie config.
    cookies.set(EXPERIMENT_COOKIE_NAME, experiments, defaultCookieConfig);
  };

  onButtonClick: () => void = () => {
    this.onInteract(VPN_PROMO_CLICK_ACTION);
  };

  onDismiss: () => void = () => {
    this.onInteract(VPN_PROMO_DISMISS_ACTION);
  };

  onImpression: () => void = () => {
    const { _tracking, _localStorage } = this.props;

    if (this.shouldShowBanner()) {
      const impressionCount = getImpressionCount(_localStorage) + 1;
      _tracking.sendEvent({
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
        label: String(impressionCount),
      });
      _localStorage.setItem(IMPRESSION_COUNT_KEY, impressionCount);
    }
  };

  componentDidMount() {
    this.onImpression();
  }

  componentDidUpdate(prevProps: InternalProps) {
    if (
      this.props.location.pathname !== prevProps.location.pathname ||
      this.props.location.search !== prevProps.location.search
    ) {
      this.onImpression();
    }
  }

  render(): null | React.Node {
    const { addonIdentifier, i18n } = this.props;

    if (!this.shouldShowBanner()) {
      return null;
    }

    const headline = i18n.t('Save 50% with a full year subscription');
    const copy = i18n.t(
      'Protect your online data\u2014and choose a VPN subscription plan that works for you.',
    );

    const ctaURL = `${VPN_URL}${makeQueryStringWithUTM({
      utm_campaign: VPN_PROMO_CAMPAIGN,
      utm_content: addonIdentifier,
    })}`;

    return (
      <div className="VPNPromoBanner">
        <div className="VPNPromoBanner-wrapper">
          <img
            alt="Mozilla VPN"
            className="VPNPromoBanner-logo"
            src={vpnLogo}
          />

          <div className="VPNPromoBanner-copy">
            <strong>{headline}</strong>
            <span>{copy}</span>
          </div>
          <a
            className="VPNPromoBanner-cta"
            href={ctaURL}
            onClick={this.onButtonClick}
          >
            {i18n.t('Get Mozilla VPN')}
          </a>
          <Button
            className="VPNPromoBanner-dismisser-button"
            onClick={this.onDismiss}
          >
            <img alt="" src={dismissX} />
          </Button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: InternalProps,
): PropsFromState => {
  const { slug } = ownProps.match.params;
  const addon = getAddonByIdInURL(state.addons, slug);

  return {
    addonIdentifier: (addon && String(addon.id)) || null,
    clientApp: state.api.clientApp,
    regionCode: state.api.regionCode,
  };
};

const VPNPromoBanner: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
  withCookies,
  connect(mapStateToProps),
)(VPNPromoBannerBase);

export default VPNPromoBanner;
