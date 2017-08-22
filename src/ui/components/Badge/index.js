/* @flow */
import React from 'react';

import Icon from 'ui/components/Icon';

import './styles.scss';

type Props = {|
  label: string,
  type?: 'featured',
|};

const Badge = ({ label, type }: Props) => {
  if (type && !['featured'].includes(type)) {
    throw new Error(`Invalid badge type given: "${type}"`);
  }

  return (
    <span className={type ? `Badge Badge-${type}` : 'Badge'}>
      {type && <Icon alt={label} name={type} />}
      {label}
    </span>
  );
};

export default Badge;
