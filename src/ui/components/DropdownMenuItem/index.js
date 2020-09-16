/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Link from 'amo/components/Link';

import './styles.scss';

type Props = {|
  children?: string | typeof Link,
  className?: string,
  detached?: boolean,
  disabled?: boolean,
  onClick?: Function,
  title?: string | null,
|};

const DropdownMenuItem = ({
  children,
  className,
  onClick,
  title,
  detached = false,
  disabled = false,
}: Props) => {
  const childIsComponent = typeof children === 'object';
  const _classNames = makeClassName(
    'DropdownMenuItem',
    {
      'DropdownMenuItem-section': !childIsComponent && !onClick,
      'DropdownMenuItem-link': childIsComponent || onClick,
      'DropdownMenuItem--detached': detached,
      'DropdownMenuItem--disabled': disabled,
    },
    className,
  );

  return (
    <li className={_classNames}>
      {onClick ? (
        <button
          disabled={disabled}
          onClick={onClick}
          title={title}
          type="button"
        >
          {children}
        </button>
      ) : (
        children
      )}
    </li>
  );
};

export default DropdownMenuItem;
