/* @flow */
/* global navigator */
import config from 'config';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import { LANDING_PAGE_PROMOTED_EXTENSION_COUNT } from 'amo/constants';
import { getPromotedBadgesLinkUrl, sendBeacon } from 'amo/utils';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';
import type { PromotedAddonsShelfType } from 'amo/reducers/home';
import type { AddonType, CollectionAddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export const PROMOTED_ADDON_CLICK_ACTION = 'sponsored-click';
export const PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY =
  'AMO Homepage Sponsored Clicks';
export const PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY =
  'AMO Homepage Sponsored Impressions';
export const PROMOTED_ADDON_IMPRESSION_ACTION = 'sponsored-impression';

type Props = {|
  addonInstallSource?: string,
  shelfData: PromotedAddonsShelfType | null,
  className?: string,
  loading: boolean,
|};

export type InternalProps = {|
  ...Props,
  i18n: I18nType,
  _config: typeof config,
  _navigator: typeof navigator,
  _tracking: typeof tracking,
|};

export class PromotedAddonsCardBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
    _navigator: navigator,
    _tracking: tracking,
  };

  sendTrackingEvent = (
    addon: AddonType | CollectionAddonType,
    action: string,
    category: string,
  ) => {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action,
      category,
      label: addon.guid,
    });
  };

  onAddonClick = (addon: AddonType | CollectionAddonType) => {
    const { _config, _navigator } = this.props;
    if (_config.get('enableFeatureUseAdzerk')) {
      sendBeacon({ _navigator, urlString: addon.url });
    }
    this.sendTrackingEvent(
      addon,
      PROMOTED_ADDON_CLICK_ACTION,
      PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
    );
  };

  onAddonImpression = (addon: AddonType | CollectionAddonType) => {
    const { _config, _navigator } = this.props;
    if (_config.get('enableFeatureUseAdzerk')) {
      sendBeacon({ _navigator, urlString: addon.url });
    }
    this.sendTrackingEvent(
      addon,
      PROMOTED_ADDON_IMPRESSION_ACTION,
      PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
    );
  };

  render() {
    const {
      addonInstallSource,
      shelfData,
      className,
      i18n,
      loading,
    } = this.props;
    let addons;

    if (shelfData) {
      addons = shelfData.addons;
    }
    // Don't display anything if there are no add-ons.
    if (Array.isArray(addons) && !addons.length) {
      return null;
    }

    const header = (
      <>
        <div className="PromotedAddonsCard-headerText">
          {i18n.gettext('Sponsored extensions')}
        </div>
        <a
          className="PromotedAddonsCard-headerLink"
          href={`${getPromotedBadgesLinkUrl({
            utm_content: 'promoted-addon-shelf',
          })}#sponsored`}
          rel="noopener noreferrer"
          target="_blank"
          title={i18n.gettext(
            'Firefox only recommends extensions that meet our standards for security and performance.',
          )}
        >
          {i18n.gettext('What is this?')}
        </a>
      </>
    );

    return (
      <AddonsCard
        addonInstallSource={addonInstallSource}
        addons={addons}
        className={makeClassName('PromotedAddonsCard', className)}
        header={header}
        onAddonClick={this.onAddonClick}
        onAddonImpression={this.onAddonImpression}
        showPromotedBadge={false}
        type="horizontal"
        loading={loading}
        placeholderCount={LANDING_PAGE_PROMOTED_EXTENSION_COUNT}
      />
    );
  }
}

const PromotedAddonsCard: React.ComponentType<Props> = compose(translate())(
  PromotedAddonsCardBase,
);

export default PromotedAddonsCard;
