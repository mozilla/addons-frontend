/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'ui/components/Icon';
import type { Props as IconProps } from 'ui/components/Icon';

import './styles.scss';

type Props = {|
  alt?: $PropertyType<IconProps, 'alt'>,
  className?: string,
|};

const IconXMark = ({ className, ...iconProps }: Props) => {
  return (
    <Icon
      {...iconProps}
      className={makeClassName('IconXMark', className)}
      name="x-mark"
    >
      <svg
        className="IconXMark-svg"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <g
          className="IconXMark-path"
          transform="translate(-1060.000000, -204.000000)"
          fill="#000000"
        >
          <g transform="translate(1060.000000, 204.000000)">
            <path d="M9.6976,8 L15.2496,2.448 C15.7041497,1.97693173 15.6972954,1.22848365 15.2341945,0.765819265 C14.7710937,0.303154885 14.0226394,0.297006317 13.552,0.752 L8,6.3024 L2.448,0.752 C2.14884707,0.430954916 1.69831113,0.29880131 1.27313775,0.407383133 C0.84796436,0.515964956 0.515964956,0.84796436 0.407383133,1.27313775 C0.29880131,1.69831113 0.430954916,2.14884707 0.752,2.448 L6.3024,8 L0.752,13.552 C0.430954916,13.8511529 0.29880131,14.3016889 0.407383133,14.7268623 C0.515964956,15.1520356 0.84796436,15.484035 1.27313775,15.5926169 C1.69831113,15.7011987 2.14884707,15.5690451 2.448,15.248 L8,9.6976 L13.552,15.2496 C14.0230683,15.7041497 14.7715164,15.6972954 15.2341807,15.2341945 C15.6968451,14.7710937 15.7029937,14.0226394 15.248,13.552 L9.6976,8 Z" />
          </g>
        </g>
      </svg>
    </Icon>
  );
};

export default IconXMark;
