/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { getPromotedCategory } from 'amo/utils/addons';
import Badge from 'amo/components/Badge';
import PromotedBadge from 'amo/components/PromotedBadge';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

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
  jed: I18nType,
|};

export class AddonBadgesBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _getPromotedCategory: getPromotedCategory,
  };

  render(): null | React.Node {
    const { _getPromotedCategory, addon, clientApp, jed } = this.props;

    if (!addon) {
      return null;
    }

    const promotedCategory = _getPromotedCategory({
      addon,
      clientApp,
      forBadging: true,
    });

    return (
      <div className="AddonBadges">
        {promotedCategory ? (
          <PromotedBadge category={promotedCategory} size="large" />
        ) : null}
        {addon.is_experimental ? (
          <Badge type="experimental" label={jed.gettext('Experimental')} />
        ) : null}
        {addon.requires_payment ? (
          <Badge
            type="requires-payment"
            label={jed.gettext('Some features may require payment')}
          />
        ) : null}
        {clientApp === CLIENT_APP_FIREFOX && addon.isAndroidCompatible && (
          <Badge
            type="android-compatible"
            label={jed.gettext('Available on Firefox for Android™')}
          />
        )}
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
