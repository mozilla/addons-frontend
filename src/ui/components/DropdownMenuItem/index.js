/* @flow */
import React from 'react';
import classNames from 'classnames';

import Link from 'amo/components/Link';

import './styles.scss';


type Props = {|
  children?: string | Link,
  detached?: boolean,
  onClick?: Function,
|};

const DropdownMenuItem = ({ children, onClick, detached = false }: Props) => {
  const childIsComponent = typeof children === 'object';
  const _classNames = classNames('DropdownMenuItem', {
    'DropdownMenuItem-section': !childIsComponent && !onClick,
    'DropdownMenuItem-link': childIsComponent || onClick,
    'DropdownMenuItem--detached': detached,
  });

  return (
    <li className={_classNames}>
      {onClick ? (
        <button onClick={onClick}>{children}</button>
      ) : (
        children
      )}
    </li>
  );
};

export default DropdownMenuItem;
