/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import withUIState from 'amo/withUIState';
import Button from 'amo/components/Button';
import IconXMark from 'amo/components/IconXMark';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

export const errorType: 'error' = 'error';
export const genericType: 'generic' = 'generic';
export const genericWarningType: 'genericWarning' = 'genericWarning';
export const firefoxRequiredType: 'firefox' = 'firefox';
export const successType: 'success' = 'success';
export const warningInfoType: 'warningInfo' = 'warningInfo';
export const warningType: 'warning' = 'warning';

const validTypes = [
  errorType,
  genericType,
  genericWarningType,
  firefoxRequiredType,
  successType,
  warningInfoType,
  warningType,
];

type UIState = {|
  wasDismissed: boolean,
|};

export type NoticeType =
  | typeof errorType
  | typeof firefoxRequiredType
  | typeof genericType
  | typeof genericWarningType
  | typeof successType
  | typeof warningInfoType
  | typeof warningType;

type Props = {|
  actionHref?: string,
  actionOnClick?: Function,
  // This will be passed to Button and then <a>, e.g. target=_blank
  actionTarget?: string,
  actionText?: string,
  actionTo?: string | Object,
  // This declares that the Notice component will be rendered against
  // a $grey-20 background.
  againstGrey20?: boolean,
  children?: React.Node,
  className?: string,
  dismissible?: boolean,
  id?: string,
  light?: boolean,
  onDismiss?: HTMLElementEventHandler,
  type: NoticeType,
|};

type InternalProps = {|
  ...Props,
  jed: I18nType,
  setUIState: (state: $Shape<UIState>) => void,
  uiState: UIState,
|};

/*
 * A Photon style notification bar.
 *
 * See https://design.firefox.com/photon/components/message-bars.html
 */
export class NoticeBase extends React.Component<InternalProps> {
  onDismissNotice: HTMLElementEventHandler = (event: ElementEvent) => {
    this.props.setUIState({ wasDismissed: true });
    if (this.props.onDismiss) {
      this.props.onDismiss(event);
    }
  };

  render(): null | React.Node {
    const {
      actionHref,
      actionOnClick,
      actionTarget,
      actionText,
      actionTo,
      againstGrey20,
      children,
      className,
      dismissible,
      jed,
      light,
      type,
      uiState,
    } = this.props;
    invariant(validTypes.includes(type), `Unknown type: ${type}`);

    if (dismissible && uiState.wasDismissed) {
      return null;
    }

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
        <Button
          className="Notice-button"
          micro
          target={actionTarget}
          {...buttonProps}
        >
          {actionText}
        </Button>
      );
    }

    const finalClass = makeClassName('Notice', `Notice-${type}`, className, {
      'Notice-againstGrey20': againstGrey20,
      'Notice-dismissible': dismissible,
      'Notice-light': light,
    });
    return (
      <div className={finalClass}>
        <div className="Notice-icon" />
        <div className="Notice-column">
          <div className="Notice-content">
            <p className="Notice-text">{children}</p>
            {actionButton}
          </div>
        </div>
        {dismissible && (
          <div className="Notice-dismisser">
            <Button
              className="Notice-dismisser-button"
              onClick={this.onDismissNotice}
            >
              <IconXMark
                className="Notice-dismisser-icon"
                alt={jed.gettext('Dismiss this notice')}
              />
            </Button>
          </div>
        )}
      </div>
    );
  }
}

const extractId = (props: Props) => {
  if (props.dismissible) {
    invariant(
      props.id,
      'When dismissible=true, the id property must be defined',
    );
  }
  return props.id || '';
};

const initialState: UIState = {
  wasDismissed: false,
};

const Notice: React.ComponentType<Props> = compose(
  withUIState({
    fileName: __filename,
    extractId,
    initialState,
  }),
  translate(),
)(NoticeBase);

export default Notice;
