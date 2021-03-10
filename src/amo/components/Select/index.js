/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import './styles.scss';

type Props = {
  className?: string,
  children?: React.Node,
};

const Select = ({ children, className, ...selectProps }: Props): React.Node => {
  return (
    <select {...selectProps} className={makeClassName('Select', className)}>
      {children}
    </select>
  );
};

export default Select;
