/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import withUIState from 'core/withUIState';
import Button from 'ui/components/Button';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  buttonType?: string,
  cancelButtonText?: string | null,
  cancelButtonType?: string,
  children: React.Element<any> | string,
  className?: string,
  confirmButtonText?: string | null,
  confirmButtonType?: string,
  id: string,
  message: string,
  onConfirm: Function,
|};

type UIStateType = {|
  showConfirmation: boolean,
|};

const initialUIState: UIStateType = { showConfirmation: false };

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

export class ConfirmButtonBase extends React.Component<InternalProps> {
  static defaultProps = {
    buttonType: 'neutral',
    cancelButtonText: null,
    cancelButtonType: 'cancel',
    confirmButtonText: null,
    confirmButtonType: 'alert',
  };

  onConfirm = (e: SyntheticEvent<HTMLButtonElement>) => {
    this.props.setUIState({ showConfirmation: false });
    this.props.onConfirm(e);
  };

  toggleConfirmation = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    this.props.setUIState({
      showConfirmation: !this.props.uiState.showConfirmation,
    });
  };

  render() {
    const {
      buttonType,
      cancelButtonText,
      cancelButtonType,
      children,
      className,
      confirmButtonText,
      confirmButtonType,
      i18n,
      id,
      message,
      onConfirm,
      uiState,
    } = this.props;

    invariant(children, 'The children property is required');
    invariant(id, 'The id property is required');
    invariant(message, 'The message property is required');
    invariant(onConfirm, 'The onConfirm property is required');

    const { showConfirmation } = uiState;

    const classNames = makeClassName('ConfirmButton', className, {
      'ConfirmButton--show-confirmation': showConfirmation,
    });

    if (showConfirmation) {
      return (
        <div className={classNames}>
          <span className="ConfirmButton-message">{message}</span>

          <div className="ConfirmButton-buttons">
            <Button
              buttonType={confirmButtonType}
              className="ConfirmButton-confirm-button"
              onClick={this.onConfirm}
            >
              {confirmButtonText || i18n.gettext('Confirm')}
            </Button>
            <Button
              buttonType={cancelButtonType}
              className="ConfirmButton-cancel-button"
              onClick={this.toggleConfirmation}
            >
              {cancelButtonText || i18n.gettext('Cancel')}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={classNames}>
        <Button
          buttonType={buttonType}
          className="ConfirmButton-default-button"
          onClick={this.toggleConfirmation}
        >
          {children}
        </Button>
      </div>
    );
  }
}

export const extractId = (ownProps: Props) => {
  return ownProps.id;
};

const ConfirmButton: React.ComponentType<Props> = compose(
  translate(),
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
    resetOnUnmount: true,
  }),
)(ConfirmButtonBase);

export default ConfirmButton;
