/* @flow */
import React from 'react';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { isQuantumCompatible } from 'core/utils/compatibility';
import Badge from 'ui/components/Badge';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  addon: AddonType,
  i18n: I18nType,
|};

export const AddonBadgesBase = (props: Props) => {
  const { addon, i18n } = props;

  if (!addon) {
    return null;
  }

  const getFeaturedText = (addonType: string) => {
    switch (addonType) {
      case ADDON_TYPE_EXTENSION:
        return i18n.gettext('Featured Extension');
      case ADDON_TYPE_THEME:
        return i18n.gettext('Featured Theme');
      default:
        return i18n.gettext('Featured Add-on');
    }
  };

  const isIncompatible = addon.type === ADDON_TYPE_EXTENSION &&
    isQuantumCompatible({ addon }) === false;

  return (
    <div className="AddonBadges">
      {addon.is_featured ? (
        <Badge
          type="featured"
          label={getFeaturedText(addon.type)}
        />
      ) : null}
      {addon.isRestartRequired ? (
        <Badge
          type="restart-required"
          label={i18n.gettext('Restart Required')}
        />
      ) : null}
      {addon.is_experimental ? (
        <Badge
          type="experimental"
          label={i18n.gettext('Experimental')}
        />
      ) : null}
      {isIncompatible ? (
        <Badge
          type="not-compatible"
          label={i18n.gettext('Not compatible with Firefox Quantum')}
        />
      ) : null}
    </div>
  );
};

export default compose(
  translate(),
)(AddonBadgesBase);
