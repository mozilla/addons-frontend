/* @flow */
import React from 'react';
import { compose } from 'redux';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
} from 'core/constants';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
|};

export const ContributeCardBase = ({ addon, i18n }: Props) => {
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
        numberOfAuthors
      );
      content = i18n.ngettext(
        i18n.gettext(`The developer of this extension asks that you help support
          its continued development by making a small contribution.`),
        i18n.gettext(`The developers of this extension ask that you help
          support its continued development by making a small contribution.`),
        numberOfAuthors
      );
      break;
    case ADDON_TYPE_THEME:
      header = i18n.ngettext(
        i18n.gettext('Support this artist'),
        i18n.gettext('Support these artists'),
        numberOfAuthors
      );
      content = i18n.ngettext(
        i18n.gettext(`The artist of this theme asks that you help support
          its continued creation by making a small contribution.`),
        i18n.gettext(`The artists of this theme ask that you help support
          its continued creation by making a small contribution.`),
        numberOfAuthors
      );
      break;
    default:
      header = i18n.ngettext(
        i18n.gettext('Support this author'),
        i18n.gettext('Support these authors'),
        numberOfAuthors
      );
      content = i18n.ngettext(
        i18n.gettext(`The author of this add-on asks that you help support
          its continued work by making a small contribution.`),
        i18n.gettext(`The authors of this add-on ask that you help support
          its continued work by making a small contribution.`),
        numberOfAuthors
      );
      break;
  }

  return (
    <Card className="ContributeCard" header={header}>
      <p className="ContributeCard-content">{content}</p>
      <p>
        <Button
          className="ContributeCard-button Button--action Button--fullwidth"
          href={addon.contributions_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="heart" />
          {i18n.gettext('Contribute now')}
        </Button>
      </p>
    </Card>
  );
};

export default compose(
  translate()
)(ContributeCardBase);
