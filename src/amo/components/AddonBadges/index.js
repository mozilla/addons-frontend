/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import { reviewListURL } from 'amo/reducers/reviews';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { getPromotedCategory } from 'amo/utils/addons';
import Badge from 'amo/components/Badge';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';
import { getPromotedProps } from 'amo/utils/promoted';

import './styles.scss';

type Props = {|
  addon: AddonType,
  hideUsers?: boolean,
|};

type DefaultProps = {|
  _getPromotedCategory: typeof getPromotedCategory,
|};

type PropsFromState = {|
  clientApp: string,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  ...PropsFromState,
  i18n: I18nType,
  location: ReactRouterLocationType,
|};

export const roundToOneDigit = (value: number | null): number => {
  return value ? Number(value.toFixed(1)) : 0;
};

export class AddonBadgesBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _getPromotedCategory: getPromotedCategory,
  };

  renderAndroidCompatibleBadge(): React.Node {
    const { addon, clientApp, i18n } = this.props;

    if (clientApp !== CLIENT_APP_FIREFOX || !addon.isAndroidCompatible) {
      return null;
    }

    return (
      <Badge
        type="android"
        label={i18n.gettext('Available on Firefox for Android™')}
        size="large"
      />
    );
  }

  renderExperimentalBadge(): React.Node {
    const { addon, i18n } = this.props;

    if (!addon.is_experimental) {
      return null;
    }

    return (
      <Badge
        type="experimental-badge"
        label={i18n.gettext('Experimental')}
        size="large"
      />
    );
  }

  renderRequiresPaymentBadge(): React.Node {
    const { addon, i18n } = this.props;

    if (!addon.requires_payment) {
      return null;
    }

    return (
      <Badge
        type="requires-payment"
        label={i18n.gettext('Some features may require payment')}
        size="large"
      />
    );
  }

  renderPromotedBadge(): React.Node {
    const { _getPromotedCategory, addon, clientApp, i18n } = this.props;

    const promotedCategory = _getPromotedCategory({
      addon,
      clientApp,
      forBadging: true,
    });

    if (!promotedCategory) {
      return null;
    }

    const props = getPromotedProps(i18n, promotedCategory);

    return (
      <Badge
        href={props.linkUrl}
        title={props.linkTitle}
        type={props.category}
        label={props.label}
        size="large"
      />
    );
  }

  renderRatingMeta(): React.Node {
    const { addon, i18n, location } = this.props;

    if (!addon?.ratings) {
      return null;
    }

    const addonRatingCount: number = addon.ratings.count;
    const averageRating: number = addon.ratings.average;

    const reviewsLink = reviewListURL({ addonSlug: addon.slug, location });
    const reviewsLabel = i18n.ngettext(
      i18n.sprintf(i18n.gettext('%(average)s (%(count)s review)'), {
        average: roundToOneDigit(averageRating || null),
        count: i18n.formatNumber(addonRatingCount),
      }),
      i18n.sprintf(i18n.gettext('%(average)s (%(count)s reviews)'), {
        average: roundToOneDigit(averageRating || null),
        count: i18n.formatNumber(addonRatingCount),
      }),
      addonRatingCount,
    );

    return (
      <Badge
        to={reviewsLink}
        type="star-full"
        label={reviewsLabel}
        size="large"
      />
    );
  }

  renderUserCount(): React.Node {
    const { addon, hideUsers, i18n } = this.props;

    if (!addon || hideUsers) {
      return null;
    }

    const averageDailyUsers = addon.average_daily_users;

    const userLabel =
      averageDailyUsers > 0
        ? i18n.sprintf(
            i18n.ngettext(
              '%(count)s User',
              '%(count)s Users',
              averageDailyUsers,
            ),
            { count: i18n.formatNumber(averageDailyUsers) },
          )
        : i18n.gettext('No Users');

    return <Badge type="user-fill" label={userLabel} size="large" />;
  }

  render(): null | React.Node {
    const { addon } = this.props;

    if (!addon) {
      return null;
    }

    return (
      <div className="AddonBadges">
        {this.renderPromotedBadge()}
        {this.renderExperimentalBadge()}
        {this.renderRequiresPaymentBadge()}
        {this.renderAndroidCompatibleBadge()}
        {this.renderRatingMeta()}
        {this.renderUserCount()}
      </div>
    );
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    clientApp: state.api.clientApp,
  };
};

const AddonBadges: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(AddonBadgesBase);

export default AddonBadges;
