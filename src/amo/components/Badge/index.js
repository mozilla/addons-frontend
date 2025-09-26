/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import Icon from 'amo/components/Icon';
import Link from 'amo/components/Link';
import type { PromotedBadgeCategory } from 'amo/utils/promoted';

import './styles.scss';

type BadgeSize = 'large' | 'small';

export type BadgeType =
  | 'experimental-badge'
  | 'requires-payment'
  | 'android'
  | 'rating'
  | 'user-fill'
  | 'star-full'
  | PromotedBadgeCategory;

/* eslint-disable react/no-unused-prop-types */
// We can disable this to enable conveniently spreading props to child components.
type BadgeRenderProps = {|
  href?: string,
  label: string,
  onClick?: Function | null,
  size: BadgeSize,
  title?: string,
  to?: string,
  type: BadgeType,
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
  children,
  className,
  href,
  onClick,
  title,
  to,
  type,
}: {|
  ...BadgeRenderProps,
  children: React.Node,
  className?: string,
|}): React.Node => {
  const hasLink = href || to;

  return (
    <div
      className={makeClassName(
        'Badge',
        {
          'Badge-border': hasLink,
        },
        className,
      )}
      data-testid={`badge-${type}`}
    >
      {hasLink ? (
        <Link
          className="Badge-link"
          href={href}
          onClick={onClick}
          prependClientApp={!href}
          prependLang={!href}
          target={href ? '_blank' : undefined}
          title={title}
          to={to}
        >
          {children}
        </Link>
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
