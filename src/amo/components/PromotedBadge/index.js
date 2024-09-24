/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import { getPromotedBadgesLinkUrl } from 'amo/utils';
import translate from 'amo/i18n/translate';
import IconPromotedBadge from 'amo/components/IconPromotedBadge';
import type {
  PromotedBadgeCategory,
  PromotedBadgeSize,
} from 'amo/components/IconPromotedBadge';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export type Props = {|
  category: PromotedBadgeCategory,
  onClick?: Function | null,
  size: PromotedBadgeSize,
|};

export type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const PromotedBadgeBase = ({
  category,
  i18n,
  onClick = null,
  size,
}: InternalProps): React.Node => {
  let label;
  let linkTitle;
  const linkUrl = getPromotedBadgesLinkUrl({
    utm_content: 'promoted-addon-badge',
  });
  switch (category) {
    case 'line':
      label = i18n.gettext('By Firefox');
      linkTitle = i18n.gettext(
        'Official add-on built by Mozilla Firefox. Meets security and performance standards.',
      );
      break;

    // This is the recommended badge
    default:
      label = i18n.gettext('Recommended');
      linkTitle = i18n.gettext(
        'Firefox only recommends add-ons that meet our standards for security and performance.',
      );
      break;
  }

  return (
    <div
      className={makeClassName('PromotedBadge', `PromotedBadge--${category}`, {
        'PromotedBadge-large': size === 'large',
        'PromotedBadge-small': size === 'small',
      })}
    >
      <a
        className={makeClassName(
          'PromotedBadge-link',
          `PromotedBadge-link--${category}`,
        )}
        href={linkUrl}
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
        title={linkTitle}
      >
        <IconPromotedBadge category={category} size={size} />
        <span
          className={makeClassName(
            'PromotedBadge-label',
            `PromotedBadge-label--${category}`,
          )}
        >
          {label}
        </span>
      </a>
    </div>
  );
};

const PromotedBadge: React.ComponentType<Props> = compose(translate())(
  PromotedBadgeBase,
);

export default PromotedBadge;
