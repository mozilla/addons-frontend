/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import type { PromotedBadgeCategory } from 'amo/utils/promoted';
import Icon from 'amo/components/Icon';

import './styles.scss';

type BadgeSize = 'large' | 'small';

export type BadgeType =
  | 'experimental-badge'
  | 'requires-payment'
  | 'android'
  | 'rating'
  | PromotedBadgeCategory;

/* eslint-disable react/no-unused-prop-types */
// We can disable this to enable conveniently spreading props to child components.
type BadgeRenderProps = {|
  type: BadgeType,
  label: string,
  size: BadgeSize,
  link?: string,
  onClick?: Function | null,
  title?: string,
|};
/* eslint-enable react/no-unused-prop-types */

export const BadgeIcon = ({
  type,
  label,
  size,
  className,
}: {|
  ...BadgeRenderProps,
  className?: string,
|}): React.Node => (
  <Icon
    name={type}
    alt={label}
    className={makeClassName('Badge-icon', `Badge-icon--${size}`, className)}
  />
);

export const BadgeContent = ({ label, size }: BadgeRenderProps): React.Node => {
  return (
    <span className={makeClassName('Badge-content', `Badge-content--${size}`)}>
      {label}
    </span>
  );
};

export const BadgePill = ({
  link,
  className,
  children,
  type,
  title,
  onClick,
}: {|
  ...BadgeRenderProps,
  children: React.Node,
  className?: string,
|}): React.Node => {
  return (
    <div
      className={makeClassName(
        'Badge',
        {
          'Badge-border': !!link,
        },
        className,
      )}
      data-testid={`badge-${type}`}
    >
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="Badge-link"
          title={title}
          onClick={onClick}
        >
          {children}
        </a>
      ) : (
        children
      )}
    </div>
  );
};

const Badge = ({
  children,
  ...props
}: {|
  ...BadgeRenderProps,
  children?: (props: BadgeRenderProps) => React.Node,
|}): React.Node => {
  if (typeof children === 'function') {
    return children(props);
  }
  return (
    <BadgePill {...props}>
      <BadgeIcon {...props} />
      <BadgeContent {...props} />
    </BadgePill>
  );
};

export default Badge;
