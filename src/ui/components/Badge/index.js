/* @flow */
import React from 'react';

import Icon from 'ui/components/Icon';

import './styles.scss';

type Props = {|
  label: string,
  type?: 'featured' | 'restart-required',
|};

const getIconNameForType = type => {
  switch (type) {
    case 'restart-required':
      return 'restart';
    default:
  }

  return type;
};

const Badge = ({ label, type }: Props) => {
  if (type && !['featured', 'restart-required'].includes(type)) {
    throw new Error(`Invalid badge type given: "${type}"`);
  }

  return (
    <span className={type ? `Badge Badge-${type}` : 'Badge'}>
      {type && <Icon alt={label} name={getIconNameForType(type)} />}
      {label}
    </span>
  );
};

export default Badge;
