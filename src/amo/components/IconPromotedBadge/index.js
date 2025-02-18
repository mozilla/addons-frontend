/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import { LINE, RECOMMENDED } from 'amo/constants';
import translate from 'amo/i18n/translate';
import Icon from 'amo/components/Icon';
import type { I18nType } from 'amo/types/i18n';
import './styles.scss';

export type PromotedBadgeCategory = typeof LINE | typeof RECOMMENDED;

export type PromotedBadgeSize = 'large' | 'small';

type Props = {|
  category: PromotedBadgeCategory,
  className?: string,
  showAlt?: boolean,
  size: PromotedBadgeSize,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const IconPromotedBadgeBase = ({
  category,
  className,
  i18n,
  showAlt = false,
  size,
}: InternalProps): React.Node => {
  const altTexts = {
    line: i18n.gettext('By Firefox'),
    recommended: i18n.gettext('Recommended'),
  };
  const alt = altTexts[category];

  return (
    <Icon
      alt={showAlt && alt ? alt : undefined}
      className={makeClassName('IconPromotedBadge', className, {
        'IconPromotedBadge-large': size === 'large',
        'IconPromotedBadge-small': size === 'small',
      })}
      name={category}
    />
  );
};

const IconPromotedBadge: React.ComponentType<Props> = compose(translate())(
  IconPromotedBadgeBase,
);
export default IconPromotedBadge;
