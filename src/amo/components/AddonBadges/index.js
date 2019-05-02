/* @flow */
import config from 'config';
import * as React from 'react';
import { compose } from 'redux';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { isQuantumCompatible } from 'core/utils/compatibility';
import Badge from 'ui/components/Badge';
import RecommendedBadge from 'ui/components/RecommendedBadge';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  i18n: I18nType,
|};

export class AddonBadgesBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
  };

  render() {
    const { _config, addon, i18n } = this.props;

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

    return (
      <div className="AddonBadges">
        {_config.get('enableFeatureRecommendedBadges') &&
        addon.is_recommended ? (
          <RecommendedBadge />
        ) : null}
        {addon.is_featured ? (
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

const AddonBadges: React.ComponentType<Props> = compose(translate())(
  AddonBadgesBase,
);

export default AddonBadges;
