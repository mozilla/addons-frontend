/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import { LANDING_PAGE_PROMOTED_EXTENSION_COUNT } from 'amo/constants';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';
import type { AppState } from 'amo/store';
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
  className?: string,
|};

export type InternalProps = {|
  ...Props,
  _tracking: typeof tracking,
  i18n: I18nType,
  resultsLoaded: boolean,
  shelves: { [shelfName: string]: Array<AddonType> | null },
|};

export class SponsoredAddonsShelfBase extends React.Component<InternalProps> {
  static defaultProps = {
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
    this.sendTrackingEvent(
      addon,
      PROMOTED_ADDON_CLICK_ACTION,
      PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
    );
  };

  onAddonImpression = (addon: AddonType | CollectionAddonType) => {
    this.sendTrackingEvent(
      addon,
      PROMOTED_ADDON_IMPRESSION_ACTION,
      PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
    );
  };

  render() {
    const {
      addonInstallSource,
      className,
      i18n,
      resultsLoaded,
      shelves,
    } = this.props;

    const { promotedExtensions } = shelves;
    if (Array.isArray(promotedExtensions) && !promotedExtensions.length) {
      // Don't display anything if there are no add-ons.
      return null;
    }

    if (Array.isArray(promotedExtensions)) {
      // If there are fewer than 6 promoted extensions, just use the first 3.
      if (promotedExtensions.length < 6) {
        promotedExtensions.splice(3);
      }
    }

    const header = (
      <>
        <div className="SponsoredAddonsShelf-headerText">
          {i18n.gettext('Sponsored extensions')}
        </div>
        <a
          className="SponsoredAddonsShelf-headerLink"
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
        addons={promotedExtensions}
        className={makeClassName('SponsoredAddonsShelf', className)}
        header={header}
        onAddonClick={this.onAddonClick}
        onAddonImpression={this.onAddonImpression}
        showPromotedBadge={false}
        type="horizontal"
        loading={resultsLoaded === false}
        placeholderCount={LANDING_PAGE_PROMOTED_EXTENSION_COUNT}
      />
    );
  }
}

export function mapStateToProps(state: AppState) {
  return {
    resultsLoaded: state.home.resultsLoaded,
    shelves: state.home.shelves,
  };
}

const SponsoredAddonsShelf: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(SponsoredAddonsShelfBase);

export default SponsoredAddonsShelf;
