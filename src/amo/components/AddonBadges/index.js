/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { getPromotedCategory } from 'amo/utils/addons';
import Badge, { BadgeContent, BadgeIcon } from 'amo/components/Badge';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import { getPromotedProps } from 'amo/utils/promoted';

import './styles.scss';

type Props = {|
  addon: AddonType,
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
|};

export class AddonBadgesBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _getPromotedCategory: getPromotedCategory,
  };

  renderAndroidCompatibleBadge(): React.Node {
    const { addon, clientApp, i18n } = this.props;

    if (clientApp !== CLIENT_APP_FIREFOX || !addon.isAndroidCompatible)
      return null;

    return (
      <Badge
        type="android"
        label={i18n.gettext('Available on Firefox for Android™')}
      >
        <BadgeIcon />
        <BadgeContent />
      </Badge>
    );
  }

  renderExperimentalBadge(): React.Node {
    const { addon, i18n } = this.props;

    if (!addon.is_experimental) return null;

    return (
      <Badge type="experimental-badge" label={i18n.gettext('Experimental')}>
        <BadgeIcon />
      </Badge>
    );
  }

  renderRequiresPaymentBadge(): React.Node {
    const { addon, i18n } = this.props;

    if (!addon.requires_payment) return null;

    return (
      <Badge
        type="requires-payment"
        label={i18n.gettext('Some features may require payment')}
      >
        <BadgeIcon />
        <BadgeContent />
      </Badge>
    );
  }

  renderPromotedBadge(): React.Node {
    const { _getPromotedCategory, addon, clientApp, i18n } = this.props;

    const promotedCategory = _getPromotedCategory({
      addon,
      clientApp,
      forBadging: true,
    });

    if (!promotedCategory) return null;

    const props = getPromotedProps(i18n, promotedCategory);
    return (
      <Badge
        link={props.linkUrl}
        title={props.linkTitle}
        type={props.category}
        label={props.label}
      >
        <BadgeIcon alt={props.alt} />
        <BadgeContent />
      </Badge>
    );
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
  connect(mapStateToProps),
  translate(),
)(AddonBadgesBase);

export default AddonBadges;
