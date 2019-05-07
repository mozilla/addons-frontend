/* @flow */
import config from 'config';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { isQuantumCompatible } from 'core/utils/compatibility';
import Badge from 'ui/components/Badge';
import RecommendedBadge from 'ui/components/RecommendedBadge';
import type { AppState } from 'amo/store';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  clientApp: string,
  i18n: I18nType,
|};

export class AddonBadgesBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
  };

  render() {
    const { _config, addon, clientApp, i18n } = this.props;

    if (!addon) {
      return null;
    }

    const getFeaturedText = (addonType: string) => {
      switch (addonType) {
        case ADDON_TYPE_EXTENSION:
          return i18n.gettext('Featured Extension');
        case ADDON_TYPE_STATIC_THEME:
        case ADDON_TYPE_THEME:
          return i18n.gettext('Featured Theme');
        default:
          return i18n.gettext('Featured Add-on');
      }
    };

    const isIncompatible =
      addon.type === ADDON_TYPE_EXTENSION &&
      isQuantumCompatible({ addon }) === false;

    const showFeaturedBadge =
      addon.is_featured &&
      (!_config.get('enableFeatureRecommendedBadges') ||
        addon.type !== ADDON_TYPE_EXTENSION);

    return (
      <div className="AddonBadges">
        {_config.get('enableFeatureRecommendedBadges') &&
        addon.is_recommended &&
        clientApp !== CLIENT_APP_ANDROID ? (
          <RecommendedBadge />
        ) : null}
        {showFeaturedBadge ? (
          <Badge type="featured" label={getFeaturedText(addon.type)} />
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
