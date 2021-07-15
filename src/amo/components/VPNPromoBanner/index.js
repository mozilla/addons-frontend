/* @flow */
import config from 'config';
import deepEqual from 'deep-eql';
import * as React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import Button from 'amo/components/Button';
import tracking from 'amo/tracking';
import translate from 'amo/i18n/translate';
import { makeQueryStringWithUTM } from 'amo/utils';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';
import vpnLogo from './img/mozilla-vpn.svg';
import dismissX from './img/x-close-black.svg';

export const VPN_PROMO_CAMPAIGN = 'amo-vpn-promo';
export const VPN_PROMO_CATEGORY = 'VPN Promo Banner';
export const VPN_PROMO_CLICK_ACTION = 'vpn-promo-banner-click';
export const VPN_PROMO_DISMISS_ACTION = 'vpn-promo-banner-dismiss';
export const VPN_PROMO_IMPRESSION_ACTION = 'vpn-promo-banner-impression';
export const VPN_URL = 'https://www.mozilla.org/products/vpn';

export type Props = {||};

export type DeafultProps = {|
  _config: typeof config,
  _tracking: typeof tracking,
|};

type InternalProps = {|
  ...Props,
  ...DeafultProps,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export class VPNPromoBannerBase extends React.Component<InternalProps> {
  static defaultProps: DeafultProps = {
    _config: config,
    _tracking: tracking,
  };

  onButtonClick: () => void = () => {
    this.props._tracking.sendEvent({
      action: VPN_PROMO_CLICK_ACTION,
      category: VPN_PROMO_CATEGORY,
    });
  };

  onDismiss: () => void = () => {
    this.props._tracking.sendEvent({
      action: VPN_PROMO_DISMISS_ACTION,
      category: VPN_PROMO_CATEGORY,
    });
  };

  onImpression: () => void = () => {
    const { _config, _tracking } = this.props;

    if (_config.get('enableFeatureVPNPromo')) {
      _tracking.sendEvent({
        action: VPN_PROMO_IMPRESSION_ACTION,
        category: VPN_PROMO_CATEGORY,
      });
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
    const { _config, i18n } = this.props;
    const headline = i18n.gettext(
      'Introductory offer ends soon: $4.99/month for Mozilla VPN',
    );
    const copy = i18n.gettext(
      `Now's the time to protect your device against hackers and prying eyes.`,
    );
    const smallText = i18n.gettext(
      'Offer only available in the United States, United Kingdom, Canada, New Zealand, Malaysia, and Singapore',
    );

    if (!_config.get('enableFeatureVPNPromo')) {
      return null;
    }

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
            <small>{smallText}</small>
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

const VPNPromoBanner: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
)(VPNPromoBannerBase);

export default VPNPromoBanner;
