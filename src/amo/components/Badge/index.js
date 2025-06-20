/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import type { PromotedBadgeCategory } from 'amo/utils/promoted';
import Icon from 'amo/components/Icon';

import './styles.scss';

type BadgeSize = 'large' | 'small';

export const BadgeIcon = ({
  name = '',
  alt = '',
  className,
  size = 'large',
}: {|
  name?: string,
  alt?: string,
  className?: string,
  size?: BadgeSize,
|}): React.Node => (
  <Icon
    name={name}
    alt={alt}
    className={makeClassName(
      'Badge-icon',
      size ? `Badge-icon--${size}` : null,
      className,
    )}
  />
);

export const BadgeContent = ({
  children,
  size,
}: {|
  children?: React.Node,
  size?: BadgeSize,
|}): React.Node => (
  <span
    className={makeClassName(
      'Badge-content',
      size ? `Badge-content--${size}` : null,
    )}
  >
    {children}
  </span>
);

export type BadgeType =
  | 'experimental-badge'
  | 'requires-payment'
  | 'android'
  | 'rating'
  | PromotedBadgeCategory;

export type Props = {|
  children: React.Node,
  type: BadgeType,
  label: string,
  link?: string,
  title?: string,
  className?: string,
  size?: BadgeSize,
  onClick?: Function | null,
|};

const Badge = ({
  children,
  type,
  label,
  link,
  title,
  className,
  size,
  onClick,
}: Props): React.Node => {
  const computedChildren = React.Children.map(children, (child) => {
    switch (child.type) {
      case BadgeIcon:
        return React.cloneElement(child, {
          name: type,
          alt: label,
          size,
          ...child.props,
        });
      case BadgeContent:
        return React.cloneElement(child, {
          children: label,
          size,
          ...child.props,
        });
      default:
        return child;
    }
  });
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
          {computedChildren}
        </a>
      ) : (
        computedChildren
      )}
    </div>
  );
};

export default Badge;
