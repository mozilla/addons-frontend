/* @flow */
import makeClassName from 'classnames';
import config from 'config';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import { LANDING_PAGE_PROMOTED_EXTENSION_COUNT } from 'amo/constants';
import { fetchSponsored, getSponsoredShelf } from 'amo/reducers/shelves';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import tracking, {
  formatDataForBeacon,
  sendBeacon,
  sendSponsoredEventBeacon,
  storeConversionInfo,
} from 'amo/tracking';
import type { SponsoredShelfType } from 'amo/reducers/shelves';
import type { AppState } from 'amo/store';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';

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
  _config: typeof config,
  _sendBeacon: typeof sendBeacon,
  _sendSponsoredEventBeacon: typeof sendSponsoredEventBeacon,
  _storeConversionInfo: typeof storeConversionInfo,
  _tracking: typeof tracking,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  isLoading: boolean,
  resultsLoaded: boolean,
  shelfData: SponsoredShelfType | null | void,
  shelves: { [shelfName: string]: Array<AddonType> | null },
|};

export class SponsoredAddonsShelfBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
    _sendBeacon: sendBeacon,
    _sendSponsoredEventBeacon: sendSponsoredEventBeacon,
    _storeConversionInfo: storeConversionInfo,
    _tracking: tracking,
    shelfData: undefined,
  };

  useAdzerk() {
    const { _config } = this.props;
    return _config.get('enableFeatureUseAdzerkForSponsoredShelf');
  }

  fetchDataIfNeeded() {
    const { isLoading, shelfData } = this.props;
    if (this.useAdzerk() && !isLoading && !shelfData) {
      this.props.dispatch(
        fetchSponsored({
          errorHandlerId: this.props.errorHandler.id,
        }),
      );
    }
  }

  constructor(props: InternalProps) {
    super(props);
    this.fetchDataIfNeeded();
  }

  componentDidMount() {
    this.sendImpressionBeacon();
  }

  componentDidUpdate(prevProps: InternalProps) {
    const { shelfData } = this.props;

    this.fetchDataIfNeeded();
    if (prevProps.shelfData !== shelfData) {
      this.sendImpressionBeacon();
    }
  }

  sendImpressionBeacon = () => {
    const { _config, _sendBeacon, shelfData } = this.props;

    if (_config.get('enableFeatureUseAdzerkForSponsoredShelf') && shelfData) {
      const { impressionData, impressionURL } = shelfData;

      if (impressionData && impressionURL) {
        _sendBeacon({
          data: formatDataForBeacon({
            data: impressionData,
            key: 'impression_data',
          }),
          urlString: impressionURL,
        });
      } else {
        log.debug(
          'impressionData or impressionURL missing from API response. Not sending beacon.',
        );
      }
    }
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
    const {
      _config,
      _sendSponsoredEventBeacon,
      _storeConversionInfo,
    } = this.props;

    if (_config.get('enableFeatureUseAdzerkForSponsoredShelf')) {
      const { event_data } = addon;

      if (event_data) {
        _sendSponsoredEventBeacon({ data: event_data.click, type: 'click' });

        _storeConversionInfo({
          addonId: addon.id,
          data: event_data.conversion,
        });
      }
    }

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
      errorHandler,
      i18n,
      isLoading,
      resultsLoaded,
      shelves,
      shelfData,
    } = this.props;

    if (this.useAdzerk() && errorHandler.hasError()) {
      log.debug(
        'Error when fetching sponsored add-ons, hiding the SponsoredAddonsShelf component.',
      );
      return null;
    }

    let sponsoredAddons;

    if (this.useAdzerk()) {
      if (shelfData) {
        sponsoredAddons = shelfData.addons;
      }
    } else if (shelves) {
      sponsoredAddons = shelves.promotedExtensions;
    }

    if (Array.isArray(sponsoredAddons) && !sponsoredAddons.length) {
      // Don't display anything if there are no add-ons.
      return null;
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
        addons={sponsoredAddons}
        className={makeClassName('SponsoredAddonsShelf', className)}
        header={header}
        onAddonClick={this.onAddonClick}
        onAddonImpression={this.onAddonImpression}
        showPromotedBadge={false}
        type="horizontal"
        loading={this.useAdzerk() ? isLoading : !resultsLoaded}
        placeholderCount={LANDING_PAGE_PROMOTED_EXTENSION_COUNT}
      />
    );
  }
}

export function mapStateToProps(state: AppState) {
  return {
    isLoading: state.shelves.isLoading,
    resultsLoaded: state.home.resultsLoaded,
    shelfData: getSponsoredShelf(state),
    shelves: state.home.shelves,
  };
}

const SponsoredAddonsShelf: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'SponsoredAddonsShelf' }),
)(SponsoredAddonsShelfBase);

export default SponsoredAddonsShelf;
