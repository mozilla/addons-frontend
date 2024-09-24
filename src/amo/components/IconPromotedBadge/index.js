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

export const paths = {
  recommended:
    'M15.449999809265137,3.999999523162842 H4.550000190734863 C4.25,3.999999523162842 4,4.219999313354492 4,4.499999523162842 V6.999999523162842 c0,1.100000023841858 0.9800000190734863,2 2.180000066757202,2 h0.05000000074505806 a3.6700000762939453,3.6700000762939453 0 0 0 3.2200000286102295,2.9600000381469727 V13.499999523162842 h1.100000023841858 V11.959999561309814 A3.6700000762939453,3.6700000762939453 0 0 0 13.770000457763672,8.999999523162842 h0.05000000074505806 C15.020000457763672,8.999999523162842 16,8.099998950958252 16,6.999999523162842 V4.499999523162842 c0,-0.2800000011920929 -0.23999999463558197,-0.5 -0.550000011920929,-0.5 zM5.099999904632568,6.999999523162842 V4.999999523162842 h1.100000023841858 v3 c-0.6100000143051147,0 -1.100000023841858,-0.44999998807907104 -1.100000023841858,-1 zm9.819999694824219,0 c0,0.550000011920929 -0.49000000953674316,1 -1.100000023841858,1 V4.999999523162842 h1.100000023841858 v2 zM11.100000381469727,13.999999523162842 H8.899999618530273 c-2.7200000286102295,0 -2.7200000286102295,2 -2.7200000286102295,2 h7.639999866485596 s0,-2 -2.7300000190734863,-2 z',
};

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
      name={category === 'line' ? 'line' : 'inline-content'}
    >
      {category !== 'line' && (
        <svg
          className="IconPromotedBadge-svg"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          <circle
            className={`IconPromotedBadge-circle-bgColor--${category}`}
            cx="50%"
            cy="50%"
            r="50%"
          />

          <g fillRule="nonzero">
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--${category}`,
              )}
              d={paths[category]}
            />
          </g>
        </svg>
      )}
    </Icon>
  );
};

const IconPromotedBadge: React.ComponentType<Props> = compose(translate())(
  IconPromotedBadgeBase,
);
export default IconPromotedBadge;
