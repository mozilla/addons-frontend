/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import IconPromotedBadge from 'ui/components/IconPromotedBadge';
import type {
  PromotedBadgeCategory,
  PromotedBadgeSize,
} from 'ui/components/IconPromotedBadge';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
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
}: InternalProps) => {
  let label;
  let linkTitle;
  let linkUrl;
  switch (category) {
    case 'line':
      label = i18n.gettext('By Firefox');
      // TODO: Update the title and URL when we know them.
      linkTitle = i18n.gettext(
        'Firefox only recommends extensions that meet our standards for security and performance.',
      );
      linkUrl = 'https://support.mozilla.org/kb/recommended-extensions-program';
      break;

    case 'recommended':
      label = i18n.gettext('Recommended');
      linkTitle = i18n.gettext(
        'Firefox only recommends extensions that meet our standards for security and performance.',
      );
      linkUrl = 'https://support.mozilla.org/kb/recommended-extensions-program';
      break;

    // This is the verified badge.
    default:
      label = i18n.gettext('Verified');
      // TODO: Update the title and URL when we know them.
      linkTitle = i18n.gettext(
        'Firefox only recommends extensions that meet our standards for security and performance.',
      );
      linkUrl = 'https://support.mozilla.org/kb/recommended-extensions-program';
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
