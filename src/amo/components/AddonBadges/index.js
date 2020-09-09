/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION } from 'core/constants';
import translate from 'core/i18n/translate';
import { getPromotedCategory } from 'core/utils/addons';
import { isQuantumCompatible } from 'core/utils/compatibility';
import Badge from 'ui/components/Badge';
import PromotedBadge from 'ui/components/PromotedBadge';
import type { AppState } from 'amo/store';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  _getPromotedCategory: typeof getPromotedCategory,
  clientApp: string,
  i18n: I18nType,
|};

export class AddonBadgesBase extends React.Component<InternalProps> {
  static defaultProps = {
    _getPromotedCategory: getPromotedCategory,
  };

  render() {
    const { _getPromotedCategory, addon, clientApp, i18n } = this.props;

    if (!addon) {
      return null;
    }

    const isIncompatible =
      addon.type === ADDON_TYPE_EXTENSION &&
      isQuantumCompatible({ addon }) === false;

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
        {addon.isRestartRequired ? (
          <Badge
            type="restart-required"
            label={i18n.gettext('Restart Required')}
          />
        ) : null}
        {addon.is_experimental ? (
          <Badge type="experimental" label={i18n.gettext('Experimental')} />
        ) : null}
        {isIncompatible ? (
          <Badge
            type="not-compatible"
            label={i18n.gettext('Not compatible with Firefox Quantum')}
          />
        ) : null}
        {addon.requires_payment ? (
          <Badge
            type="requires-payment"
            label={i18n.gettext('Some features may require payment')}
          />
        ) : null}
      </div>
    );
  }
}

export const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
  };
};

const AddonBadges: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonBadgesBase);

export default AddonBadges;
