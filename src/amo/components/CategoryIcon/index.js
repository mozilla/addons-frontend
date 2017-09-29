import React from 'react';
import classNames from 'classnames';

import Icon from 'ui/components/Icon';
import type { Props as IconProps } from 'ui/components/Icon';

import './styles.scss';


type Props = IconProps & {|
  color: string,
|};

const CategoryIcon = ({ alt, className, color, name }: Props) => {
  return (
    <Icon
      alt={alt}
      className={classNames(
        'CategoryIcon',
        `CategoryIcon-${color}`,
        className
      )}
      name={name}
    />
  );
};

export default CategoryIcon;
