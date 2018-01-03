/* @flow */
import makeClassName from 'classnames';
import React from 'react';

import './styles.scss';


type Props = {
  className?: string,
  // TODO: fixme
  children: any,
};

const Select = ({ children, className, ...selectProps }: Props) => {
  // TODO: add tests for className and children, and ...selectProps
  return (
    <select className={makeClassName('Select', className)} {...selectProps}>
      {children}
    </select>
  );
};

export default Select;
