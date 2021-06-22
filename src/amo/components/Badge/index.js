/* @flow */
import * as React from 'react';

import Icon from 'amo/components/Icon';

import './styles.scss';

export type Props = {|
  label: string,
  type?: 'experimental' | 'requires-payment',
|};

const getIconNameForType = (type) => {
  switch (type) {
    case 'experimental':
      return 'experimental-badge';
    default:
  }

  return type;
};

const Badge = ({ label, type }: Props): React.Node => {
  if (type && !['experimental', 'requires-payment'].includes(type)) {
    throw new Error(`Invalid badge type given: "${type}"`);
  }

  return (
    <div className={type ? `Badge Badge-${type}` : 'Badge'}>
      {type && <Icon alt={label} name={getIconNameForType(type)} />}
      {label}
    </div>
  );
};

export default Badge;
