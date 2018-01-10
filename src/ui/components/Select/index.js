/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import './styles.scss';


type Props = {
  className?: string,
  children?: React.Node,
};

const Select = ({ children, className, ...selectProps }: Props) => {
  return (
    <select
      className={makeClassName('Select', className)}
      {...selectProps}
    >
      {children}
    </select>
  );
};

export default Select;
