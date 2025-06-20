/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import AddonTitle from 'amo/components/AddonTitle';
import Link from 'amo/components/Link';
import RatingsByStar from 'amo/components/RatingsByStar';
import translate from 'amo/i18n/translate';
import { getAddonIconUrl } from 'amo/imageUtils';
import {
  addQueryParams,
  getQueryParametersForAttribution,
} from 'amo/utils/url';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import Rating from 'amo/components/Rating';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import { roundToOneDigit } from 'amo/components/AddonBadges';
import { getAddonURL } from 'amo/utils';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  headerText: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export const AddonSummaryCardBase = ({
  addon,
  headerText,
  i18n,
  location,
}: InternalProps): React.Node => {
  const queryParamsForAttribution = getQueryParametersForAttribution(location);
  const addonUrl = addon
    ? addQueryParams(getAddonURL(addon.slug), queryParamsForAttribution)
    : '';
  const iconUrl = getAddonIconUrl(addon);
  const iconImage = (
    <img
      className="AddonSummaryCard-header-icon-image"
      src={iconUrl}
      alt={i18n.gettext('Add-on icon')}
    />
  );

  const metaHeader = (
    <div className="AddonSummaryCard-header">
      <div className="AddonSummaryCard-header-icon">
        {addon ? <Link to={addonUrl}>{iconImage}</Link> : iconImage}
      </div>
      <div className="AddonSummaryCard-header-text">
        <h1 className="visually-hidden">{headerText}</h1>
        <AddonTitle
          addon={addon}
          linkToAddon
          queryParamsForAttribution={queryParamsForAttribution}
        />
      </div>
    </div>
  );

  let addonAverage;
  if (addon && addon.ratings) {
    const roundedAverage = roundToOneDigit(addon.ratings.average);
    addonAverage = i18n.sprintf(
      // eslint-disable-next-line max-len
      // L10n: roundedAverage is a number rounded to one digit, such as 4.5 in English or ٤٫٧ in Arabic.
      i18n.ngettext(
        '%(rating)s Star out of 5',
        '%(rating)s Stars out of 5',
        roundedAverage,
      ),
      { rating: i18n.formatNumber(roundedAverage) },
    );
  }

  return (
    <Card header={metaHeader} className="AddonSummaryCard">
      <div className="AddonSummaryCard-overallRatingStars">
        <Rating
          rating={addon && addon.ratings && addon.ratings.average}
          readOnly
          yellowStars
        />
        <div className="AddonSummaryCard-addonAverage">
          {addon ? addonAverage : <LoadingText minWidth={20} />}
        </div>
      </div>
      <RatingsByStar addon={addon} />
    </Card>
  );
};

const AddonSummaryCard: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
)(AddonSummaryCardBase);

export default AddonSummaryCard;
