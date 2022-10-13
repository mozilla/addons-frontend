import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'amo/components/Icon';
import type { Props as IconProps } from 'amo/components/Icon';
import './styles.scss';

type Props = IconProps & {
  color: number;
};

const CategoryIcon = ({
  alt,
  className,
  color,
  name,
}: Props): React.ReactNode => {
  return <Icon alt={alt} className={makeClassName('CategoryIcon', `CategoryIcon-${color}`, className)} name={name} />;
};

export default CategoryIcon;