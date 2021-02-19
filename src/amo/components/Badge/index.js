/* @flow */
import * as React from 'react';

import Icon from 'amo/components/Icon';

import './styles.scss';

export type Props = {|
  label: string,
  type?:
    | 'experimental'
    | 'restart-required'
    | 'not-compatible'
    | 'requires-payment',
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

const Badge = ({ label, type }: Props): React.Element<"div"> => {
  if (
    type &&
    ![
      'not-compatible',
      'experimental',
      'restart-required',
      'requires-payment',
    ].includes(type)
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
