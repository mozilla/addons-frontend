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

  const classnames = classNames('DropdownMenuItem', {
    'DropdownMenuItem-section': !childIsComponent && !onClick,
    'DropdownMenuItem-link': childIsComponent || onClick,
    'DropdownMenuItem--detached': detached,
  });

  return (
    <li className={classnames}>
      {onClick ? (
        <button onClick={onClick}>{children}</button>
      ) : (
        children
      )}
    </li>
  );
};

export default DropdownMenuItem;
