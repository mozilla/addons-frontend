/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

const errorType: 'error' = 'error';
const genericType: 'generic' = 'generic';
const successType: 'success' = 'success';
const firefoxRequiredType: 'firefox' = 'firefox';
const validTypes = [errorType, genericType, successType, firefoxRequiredType];

type Props = {|
  actionHref?: string,
  actionOnClick?: Function,
  actionText?: string,
  actionTo?: string | Object,
  children?: React.Node,
  className?: string,
  dismissible?: boolean,
  type:
    | typeof errorType
    | typeof firefoxRequiredType
    | typeof genericType
    | typeof successType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

/*
 * A Photon style notification bar.
 *
 * See https://design.firefox.com/photon/components/message-bars.html
 */
export const NoticeBase = ({
  actionHref,
  actionOnClick,
  actionText,
  actionTo,
  children,
  className,
  dismissible,
  i18n,
  type,
}: InternalProps) => {
  invariant(validTypes.includes(type), `Unknown type: ${type}`);

  const buttonProps = {
    href: actionHref || undefined,
    onClick: actionOnClick || undefined,
    to: actionTo || undefined,
  };

  let actionButton;
  if (Object.values(buttonProps).some((val) => val !== undefined)) {
    invariant(
      actionText,
      'When specifying an action button, actionText is required',
    );
    actionButton = (
      <Button className="Notice-button" micro {...buttonProps}>
        {actionText}
      </Button>
    );
  }

  // TODO: different Icon names for different notice types.
  const finalClass = makeClassName('Notice', `Notice-${type}`, className, {
    'Notice-dismissible': dismissible,
  });
  return (
    <div className={finalClass}>
      <div className="Notice-icon" />
      <div className="Notice-column">
        <div>
          <p className="Notice-text">{children}</p>
          {actionButton}
        </div>
      </div>
      {dismissible && (
        <div className="Notice-dismisser">
          <Icon
            className="Notice-dismisser-icon"
            name="x-mark-white"
            alt={i18n.gettext('Dismiss this notice')}
          />
        </div>
      )}
    </div>
  );
};

const Notice: React.ComponentType<Props> = compose(translate())(NoticeBase);

export default Notice;
