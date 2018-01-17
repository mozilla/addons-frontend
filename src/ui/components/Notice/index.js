/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import Button from 'ui/components/Button';

import './styles.scss';

const errorType: 'error' = 'error';
const successType: 'success' = 'success';
const validTypes = [errorType, successType];

type Props = {
  action?: Function,
  actionText?: string,
  children?: React.Node,
  className?: string,
  type: typeof errorType | typeof successType;
};

/*
 * A Photon style notification bar.
 *
 * See https://design.firefox.com/photon/components/message-bars.html
 *
 * TODO: implement generic notices and warnings.
 */
const Notice = ({
  action, actionText, children, className, type,
}: Props) => {
  if (!validTypes.includes(type)) {
    throw new Error(`Unknown type: ${type}`);
  }

  let actionButton;
  if (action && actionText) {
    actionButton = (
      <Button
        className="Button--small Notice-button"
        onClick={action}
      >
        {actionText}
      </Button>
    );
  }

  const finalClass = makeClassName('Notice', `Notice-${type}`, className);
  return (
    <div className={finalClass}>
      <div className="Notice-icon" />
      <div className="Notice-column">
        <p className="Notice-text">
          {children}
        </p>
        {actionButton}
      </div>
    </div>
  );
};

export default Notice;
