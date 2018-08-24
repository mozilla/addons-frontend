/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import withUIState from 'core/withUIState';
import Button from 'ui/components/Button';
import IconXMark from 'ui/components/IconXMark';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

const errorType: 'error' = 'error';
const genericType: 'generic' = 'generic';
const successType: 'success' = 'success';
const firefoxRequiredType: 'firefox' = 'firefox';
const validTypes = [errorType, genericType, successType, firefoxRequiredType];

type UIState = {|
  wasDismissed: boolean,
|};

type Props = {|
  actionHref?: string,
  actionOnClick?: Function,
  // This will be passed to Button and then <a>, e.g. target=_blank
  actionTarget?: string,
  actionText?: string,
  actionTo?: string | Object,
  children?: React.Node,
  className?: string,
  dismissible?: boolean,
  id?: string,
  onDismiss?: (SyntheticEvent<any>) => void,
  type:
    | typeof errorType
    | typeof firefoxRequiredType
    | typeof genericType
    | typeof successType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  setUIState: (state: $Shape<UIState>) => void,
  uiState: UIState,
|};

/*
 * A Photon style notification bar.
 *
 * See https://design.firefox.com/photon/components/message-bars.html
 */
export class NoticeBase extends React.Component<InternalProps> {
  onDismissNotice = (event: SyntheticEvent<any>) => {
    this.props.setUIState({ wasDismissed: true });
    if (this.props.onDismiss) {
      this.props.onDismiss(event);
    }
  };

  render() {
    const {
      actionHref,
      actionOnClick,
      actionTarget,
      actionText,
      actionTo,
      children,
      className,
      dismissible,
      i18n,
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
            <Button
              className="Notice-dismisser-button"
              onClick={this.onDismissNotice}
            >
              <IconXMark
                className="Notice-dismisser-icon"
                alt={i18n.gettext('Dismiss this notice')}
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
