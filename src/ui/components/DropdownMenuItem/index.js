/* @flow */
import React from 'react';
import classNames from 'classnames';
import { oneLine } from 'common-tags';

import Link from 'amo/components/Link';

import './styles.scss';


type Props = {|
  children: string | Link,
  detached?: boolean,
  onClick?: Function,
|};

const DropdownMenuItem = ({ children, onClick, detached = false }: Props) => {
  const childIsComponent = typeof children === 'object';

  if (
    childIsComponent &&
    children.type && children.type.displayName !== 'Connect(LinkBase)'
  ) {
    throw new Error(oneLine`Only the "Link" component is supported as a child
      of "DropdownMenuItem", got: ${children.type.displayName}`);
  }

  if (!childIsComponent && !onClick) {
    return (
      <li className="DropdownMenuItem DropdownMenuItem-section">
        {children}
      </li>
    );
  }

  const classnames = classNames('DropdownMenuItem-link', {
    'DropdownMenuItem-link--detached': detached,
  });

  if (childIsComponent) {
    return (
      <li className="DropdownMenuItem">
        {React.cloneElement((children: Link), { className: classnames })}
      </li>
    );
  }

  return (
    <li className="DropdownMenuItem">
      <button className={classnames} onClick={onClick}>
        {children}
      </button>
    </li>
  );
};

export default DropdownMenuItem;
