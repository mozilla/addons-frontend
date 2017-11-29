/* @flow */
import makeClassName from 'classnames';
import React from 'react';

import './styles.scss';


type Props = {|
  className?: string,
  // TODO: fixme
  children: any,
|};

const Select = ({ children, className }: Props) => {
  // TODO: add tests for className and children
  return (
    <select className={makeClassName('Select', className)}>
      {children}
    </select>
  );
};

export default Select;
