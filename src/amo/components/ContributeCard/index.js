/* @flow */
/* global window */
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import makeClassName from 'classnames';

import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import translate from 'amo/i18n/translate';
import tracking, { getAddonEventParams } from 'amo/tracking';
import { getPromotedCategory } from 'amo/utils/addons';
import Button from 'amo/components/Button';
import Icon from 'amo/components/Icon';
import type { AddonType } from 'amo/types/addons';
import type { AppState } from 'amo/store';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const CONTRIBUTE_BUTTON_CLICK_CATEGORY =
  'amo_addon_contribute_button_clicks';

type Props = {|
  addon: AddonType | null,
  clientApp: string,
  i18n: I18nType,
|};

type PropsFromState = {|
  clientApp: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  _tracking: typeof tracking,
  _getPromotedCategory: typeof getPromotedCategory,
|};

export const ContributeCardBase = ({
  _tracking = tracking,
  _getPromotedCategory = getPromotedCategory,
  addon,
  clientApp,
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
      category: CONTRIBUTE_BUTTON_CLICK_CATEGORY,
      params: {
        ...getAddonEventParams(addon, window.location.pathname),
        trusted: !!_getPromotedCategory({ addon, clientApp }),
      },
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

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    clientApp: state.api.clientApp,
  };
};

const ContributeCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(ContributeCardBase);

export default ContributeCard;
