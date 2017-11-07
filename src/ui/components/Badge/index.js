/* @flow */
import React from 'react';

import Icon from 'ui/components/Icon';

import './styles.scss';


type Props = {|
  label: string,
  type?: 'experimental' | 'featured' | 'restart-required' | 'not-compatible',
|};

const getIconNameForType = (type) => {
  switch (type) {
    case 'experimental':
      return 'experimental-badge';
    case 'restart-required':
      return 'restart';
    default:
  }

  return type;
};

const Badge = ({ label, type }: Props) => {
  if (type && ![
    'not-compatible',
    'experimental',
    'featured',
    'restart-required',
  ].includes(type)) {
    throw new Error(`Invalid badge type given: "${type}"`);
  }

  return (
    <div className={type ? `Badge Badge-${type}` : 'Badge'}>
      {label}
      {type && <Icon alt={label} name={getIconNameForType(type)} />}
    </div>
  );
};

export default Badge;
