/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import makeClassName from 'classnames';

import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import translate from 'amo/i18n/translate';
import tracking from 'amo/tracking';
import Button from 'amo/components/Button';
import Icon from 'amo/components/Icon';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const CONTRIBUTE_BUTTON_CLICK_ACTION = 'contribute-click';
export const CONTRIBUTE_BUTTON_CLICK_CATEGORY =
  'AMO Addon / Contribute Button Clicks';

type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
|};

type InternalProps = {|
  ...Props,
  _tracking: typeof tracking,
|};

export const ContributeCardBase = ({
  _tracking = tracking,
  addon,
  i18n,
}: InternalProps): null | React.Node => {
  if (!addon || (addon && !addon.contributions_url)) {
    return null;
  }

  const numberOfAuthors = addon.authors ? addon.authors.length : 1;

  let header;
  let content;
  switch (addon.type) {
    case ADDON_TYPE_EXTENSION:
      header = i18n.ngettext(
        i18n.gettext('Support this developer'),
        i18n.gettext('Support these developers'),
        numberOfAuthors,
      );
      content = i18n.ngettext(
        i18n.gettext(`The developer of this extension asks that you help support
          its continued development by making a small contribution.`),
        i18n.gettext(`The developers of this extension ask that you help
          support its continued development by making a small contribution.`),
        numberOfAuthors,
      );
      break;
    case ADDON_TYPE_STATIC_THEME:
      header = i18n.ngettext(
        i18n.gettext('Support this artist'),
        i18n.gettext('Support these artists'),
        numberOfAuthors,
      );
      content = i18n.ngettext(
        i18n.gettext(`The artist of this theme asks that you help support
          its continued creation by making a small contribution.`),
        i18n.gettext(`The artists of this theme ask that you help support
          its continued creation by making a small contribution.`),
        numberOfAuthors,
      );
      break;
    default:
      header = i18n.ngettext(
        i18n.gettext('Support this author'),
        i18n.gettext('Support these authors'),
        numberOfAuthors,
      );
      content = i18n.ngettext(
        i18n.gettext(`The author of this add-on asks that you help support
          its continued work by making a small contribution.`),
        i18n.gettext(`The authors of this add-on ask that you help support
          its continued work by making a small contribution.`),
        numberOfAuthors,
      );
      break;
  }

  const onButtonClick = () => {
    _tracking.sendEvent({
      action: CONTRIBUTE_BUTTON_CLICK_ACTION,
      category: CONTRIBUTE_BUTTON_CLICK_CATEGORY,
      label: addon.guid,
    });
  };

  const addonType = addon ? addon.type : ADDON_TYPE_EXTENSION;

  return (
    <div
      className={makeClassName('ContributeCard', `ContributeCard-${addonType}`)}
    >
      <header className="ContributeCard-header">{header}</header>
      <p className="ContributeCard-content">{content}</p>
      <p>
        <Button
          buttonType="action"
          className="ContributeCard-button"
          href={
            (addon.contributions_url && addon.contributions_url.outgoing) || ''
          }
          title={addon.contributions_url && addon.contributions_url.url}
          onClick={onButtonClick}
          target="_blank"
          puffy
        >
          <Icon name="heart" />
          {i18n.gettext('Contribute now')}
        </Button>
      </p>
    </div>
  );
};

const ContributeCard: React.ComponentType<Props> = compose(translate())(
  ContributeCardBase,
);

export default ContributeCard;
