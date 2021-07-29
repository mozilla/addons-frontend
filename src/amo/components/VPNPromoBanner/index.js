/* @flow */
/* global window */
import deepEqual from 'deep-eql';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import Button from 'amo/components/Button';
import {
  VARIANT_SHOW,
  shouldExcludeUser,
} from 'amo/experiments/20210714_amo_vpn_promo';
import tracking from 'amo/tracking';
import translate from 'amo/i18n/translate';
import { makeQueryStringWithUTM } from 'amo/utils';
import type { RegionCodeType } from 'amo/reducers/api';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';

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

export type DeafultProps = {|
  _tracking: typeof tracking,
  _localStorage: typeof window.localStorage | Object,
|};

type PropsFromState = {|
  clientApp: string,
  regionCode: RegionCodeType,
|};

type InternalProps = {|
  ...Props,
  ...DeafultProps,
  ...PropsFromState,
  i18n: I18nType,
  location: ReactRouterLocationType,
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

export class VPNPromoBannerBase extends React.Component<InternalProps> {
  static defaultProps: DeafultProps = {
    _tracking: tracking,
    _localStorage: typeof window !== 'undefined' ? window.localStorage : {},
  };

  shouldShowBanner(): boolean {
    const { clientApp, regionCode, variant } = this.props;

    return (
      variant === VARIANT_SHOW &&
      !shouldExcludeUser({
        clientApp,
        regionCode,
      })
    );
  }

  onInteract: (action: string) => void = (action) => {
    const { _tracking, _localStorage } = this.props;

    const impressionCount = getImpressionCount(_localStorage);
    _tracking.sendEvent({
      action,
      category: VPN_PROMO_CATEGORY,
      label: String(impressionCount),
    });
    _localStorage.removeItem(IMPRESSION_COUNT_KEY);
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
    if (!deepEqual(this.props.location, prevProps.location)) {
      this.onImpression();
    }
  }

  render(): null | React.Node {
    const { i18n } = this.props;

    if (!this.shouldShowBanner()) {
      return null;
    }

    const headline = i18n.gettext('Save 50% with a full year subscription');
    const copy = i18n.gettext(
      `Protect your online data—and choose a VPN subscription plan that works
       for you.`,
    );

    const ctaURL = `${VPN_URL}${makeQueryStringWithUTM({
      utm_campaign: VPN_PROMO_CAMPAIGN,
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
            {i18n.gettext('Get Mozilla VPN')}
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

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    clientApp: state.api.clientApp,
    regionCode: state.api.regionCode,
  };
};

const VPNPromoBanner: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
  connect(mapStateToProps),
)(VPNPromoBannerBase);

export default VPNPromoBanner;
