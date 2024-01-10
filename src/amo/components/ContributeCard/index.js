/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import translate from 'amo/i18n/translate';
import tracking from 'amo/tracking';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
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
      header = /* manual-change: merge keys 
      'Support this developer' -> 'Support this developer_one'
      'Support these developers' -> 'Support this developer_other' */ i18n.t(
        'Support this developer',
        { count: numberOfAuthors },
      );
      content = /* manual-change: merge keys 
      'The developer of this extension asks that you help support
                its continued development by making a small contribution.' -> 'The developer of this extension asks that you help support
                its continued development by making a small contribution._one'
      'The developers of this extension ask that you help
                support its continued development by making a small contribution.' -> 'The developer of this extension asks that you help support
                its continued development by making a small contribution._other' */ i18n.t(
        'The developer of this extension asks that you help support its continued development by making a small contribution.',
        { count: numberOfAuthors },
      );
      break;
    case ADDON_TYPE_STATIC_THEME:
      header = /* manual-change: merge keys 
      'Support this artist' -> 'Support this artist_one'
      'Support these artists' -> 'Support this artist_other' */ i18n.t(
        'Support this artist',
        { count: numberOfAuthors },
      );
      content = /* manual-change: merge keys 
      'The artist of this theme asks that you help support
                its continued creation by making a small contribution.' -> 'The artist of this theme asks that you help support
                its continued creation by making a small contribution._one'
      'The artists of this theme ask that you help support
                its continued creation by making a small contribution.' -> 'The artist of this theme asks that you help support
                its continued creation by making a small contribution._other' */ i18n.t(
        'The artist of this theme asks that you help support its continued creation by making a small contribution.',
        { count: numberOfAuthors },
      );
      break;
    default:
      header = /* manual-change: merge keys 
      'Support this author' -> 'Support this author_one'
      'Support these authors' -> 'Support this author_other' */ i18n.t(
        'Support this author',
        { count: numberOfAuthors },
      );
      content = /* manual-change: merge keys 
      'The author of this add-on asks that you help support
                its continued work by making a small contribution.' -> 'The author of this add-on asks that you help support
                its continued work by making a small contribution._one'
      'The authors of this add-on ask that you help support
                its continued work by making a small contribution.' -> 'The author of this add-on asks that you help support
                its continued work by making a small contribution._other' */ i18n.t(
        'The author of this add-on asks that you help support its continued work by making a small contribution.',
        { count: numberOfAuthors },
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

  return (
    <Card className="ContributeCard" header={header}>
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
          {i18n.t('Contribute now')}
        </Button>
      </p>
    </Card>
  );
};

const ContributeCard: React.ComponentType<Props> = compose(translate())(
  ContributeCardBase,
);

export default ContributeCard;
