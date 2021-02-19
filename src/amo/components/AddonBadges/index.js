/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION } from 'amo/constants';
import translate from 'amo/i18n/translate';
import { getPromotedCategory } from 'amo/utils/addons';
import { isQuantumCompatible } from 'amo/utils/compatibility';
import Badge from 'amo/components/Badge';
import PromotedBadge from 'amo/components/PromotedBadge';
import type { AppState } from 'amo/store';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import type { PromotedCategoryType } from '../../constants';
import type { SuggestionType } from '../../reducers/autocomplete';

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
  static defaultProps: {|
    _getPromotedCategory: ({|
      addon: ?(AddonType | CollectionAddonType | SuggestionType),
      clientApp: string,
      forBadging?: boolean,
    |}) => PromotedCategoryType | null,
  |} = {
    _getPromotedCategory: getPromotedCategory,
  };

  render(): null | React.Element<'div'> {
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

export const mapStateToProps = (
  state: AppState,
): {| clientApp: null | string |} => {
  return {
    clientApp: state.api.clientApp,
  };
};

const AddonBadges: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonBadgesBase);

export default AddonBadges;
