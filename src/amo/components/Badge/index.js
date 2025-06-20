/* @flow */
import * as React from 'react';

import type { PromotedBadgeCategory } from 'amo/utils/promoted';
import Icon from 'amo/components/Icon';

import './styles.scss';

export type Props = {|
  label: string,
  type?: 'experimental' | 'requires-payment' | 'android-compatible',
|};

const getIconNameForType = (type) => {
  switch (type) {
    case 'experimental':
      return 'experimental-badge';
    case 'android-compatible':
      return 'android';
    default:
  }

  return type;
};

const Badge = ({ label, type }: Props): React.Node => {
  if (
    type &&
    !['experimental', 'requires-payment', 'android-compatible'].includes(type)
  ) {
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
