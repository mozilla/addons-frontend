/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';

import Button from 'ui/components/Button';

import './styles.scss';

const errorType: 'error' = 'error';
const genericType: 'generic' = 'generic';
const successType: 'success' = 'success';
const firefoxRequiredType: 'firefox' = 'firefox';
const validTypes = [errorType, genericType, successType, firefoxRequiredType];

type Props = {
  actionHref?: string,
  actionOnClick?: Function,
  actionText?: string,
  // This is the `to` prop of <Link/>
  actionTo?: string | Object,
  children?: React.Node,
  className?: string,
  type:
    | typeof errorType
    | typeof firefoxRequiredType
    | typeof genericType
    | typeof successType,
};

/*
 * A Photon style notification bar.
 *
 * See https://design.firefox.com/photon/components/message-bars.html
 */
const Notice = ({
  actionHref,
  actionOnClick,
  actionText,
  actionTo,
  children,
  className,
  type,
}: Props) => {
  invariant(validTypes.includes(type), `Unknown type: ${type}`);

  const actionProps = {
    href: actionHref || undefined,
    onClick: actionOnClick || undefined,
    to: actionTo || undefined,
  };

  let actionButton;
  if (Object.values(actionProps).some((val) => val !== undefined)) {
    invariant(
      actionText,
      'When specifying an action button, actionText is required',
    );
    actionButton = (
      <Button className="Notice-button" micro {...actionProps}>
        {actionText}
      </Button>
    );
  }

  const finalClass = makeClassName('Notice', `Notice-${type}`, className);
  return (
    <div className={finalClass}>
      <div className="Notice-icon" />
      <div className="Notice-column">
        <div>
          <p className="Notice-text">{children}</p>
          {actionButton}
        </div>
      </div>
    </div>
  );
};

export default Notice;
