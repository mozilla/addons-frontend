/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'ui/components/Icon';
import type { Props as IconProps } from 'ui/components/Icon';

import './styles.scss';

export type RecommendedBadgeSize = 'large' | 'small';

type Props = {|
  alt?: $PropertyType<IconProps, 'alt'>,
  className?: string,
  size: RecommendedBadgeSize,
|};

const IconRecommendedBadge = ({ className, size, ...iconProps }: Props) => {
  return (
    <Icon
      {...iconProps}
      className={makeClassName('IconRecommendedBadge', className, {
        'IconRecommendedBadge-large': size === 'large',
        'IconRecommendedBadge-small': size === 'small',
      })}
      name="inline-content"
    >
      <svg
        className="IconRecommendedBadge-svg"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <circle
          className="IconRecommendedBadge-shellPath"
          cx="50%"
          cy="50%"
          r="50%"
        />
        <g fillRule="nonzero">
          <path
            className="IconRecommendedBadge-iconPath"
            d="M15.449999809265137,3.999999523162842 H4.550000190734863 C4.25,3.999999523162842 4,4.219999313354492 4,4.499999523162842 V6.999999523162842 c0,1.100000023841858 0.9800000190734863,2 2.180000066757202,2 h0.05000000074505806 a3.6700000762939453,3.6700000762939453 0 0 0 3.2200000286102295,2.9600000381469727 V13.499999523162842 h1.100000023841858 V11.959999561309814 A3.6700000762939453,3.6700000762939453 0 0 0 13.770000457763672,8.999999523162842 h0.05000000074505806 C15.020000457763672,8.999999523162842 16,8.099998950958252 16,6.999999523162842 V4.499999523162842 c0,-0.2800000011920929 -0.23999999463558197,-0.5 -0.550000011920929,-0.5 zM5.099999904632568,6.999999523162842 V4.999999523162842 h1.100000023841858 v3 c-0.6100000143051147,0 -1.100000023841858,-0.44999998807907104 -1.100000023841858,-1 zm9.819999694824219,0 c0,0.550000011920929 -0.49000000953674316,1 -1.100000023841858,1 V4.999999523162842 h1.100000023841858 v2 zM11.100000381469727,13.999999523162842 H8.899999618530273 c-2.7200000286102295,0 -2.7200000286102295,2 -2.7200000286102295,2 h7.639999866485596 s0,-2 -2.7300000190734863,-2 z"
          />
        </g>
      </svg>
    </Icon>
  );
};

export default IconRecommendedBadge;
