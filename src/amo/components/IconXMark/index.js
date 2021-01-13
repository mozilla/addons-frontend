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
      name="inline-content"
    >
      <svg
        className="IconXMark-svg"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <g
          className="IconXMark-path"
          transform="translate(-1.000000, -1.000000)"
          fill="#0C0C0D"
        >
          <path d="M1.293,2.707 C1.03304342,2.45592553 0.928787403,2.08412211 1.02030284,1.73449268 C1.11181828,1.38486324 1.38486324,1.11181828 1.73449268,1.02030284 C2.08412211,0.928787403 2.45592553,1.03304342 2.707,1.293 L8,6.586 L13.293,1.293 C13.5440745,1.03304342 13.9158779,0.928787403 14.2655073,1.02030284 C14.6151368,1.11181828 14.8881817,1.38486324 14.9796972,1.73449268 C15.0712126,2.08412211 14.9669566,2.45592553 14.707,2.707 L9.414,8 L14.707,13.293 C15.0859722,13.6853789 15.0805524,14.3090848 14.6948186,14.6948186 C14.3090848,15.0805524 13.6853789,15.0859722 13.293,14.707 L8,9.414 L2.707,14.707 C2.31462111,15.0859722 1.69091522,15.0805524 1.30518142,14.6948186 C0.919447626,14.3090848 0.91402779,13.6853789 1.293,13.293 L6.586,8 L1.293,2.707 Z" />
        </g>
      </svg>
    </Icon>
  );
};

export default IconXMark;
