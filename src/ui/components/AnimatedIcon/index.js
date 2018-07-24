/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'ui/components/Icon';
import type { Props as IconProps } from 'ui/components/Icon';

import './styles.scss';

type Props = IconProps;

const AnimatedIcon = ({ alt, className, name }: Props) => (
  <span
    className={makeClassName('AnimatedIcon', `AnimatedIcon-${name}`, className)}
  >
    <Icon alt={alt} name={name} />
  </span>
);

export default AnimatedIcon;
