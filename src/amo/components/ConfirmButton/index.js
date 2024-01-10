/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import withUIState from 'amo/withUIState';
import Button from 'amo/components/Button';
import ConfirmationDialog from 'amo/components/ConfirmationDialog';
import type { ButtonType } from 'amo/components/Button';
import type { Props as ConfirmationDialogProps } from 'amo/components/ConfirmationDialog';
import type { ElementEvent, HTMLElementEventHandler } from 'amo/types/dom';

type DefaultProps = {|
  buttonType?: ButtonType,
|};

type Props = {|
  ...DefaultProps,
  htmlType?: string,
  cancelButtonText?: $PropertyType<ConfirmationDialogProps, 'cancelButtonText'>,
  cancelButtonType?: $PropertyType<ConfirmationDialogProps, 'cancelButtonType'>,
  children: React.Node | string,
  className?: string,
  confirmButtonText?: $PropertyType<
    ConfirmationDialogProps,
    'confirmButtonText',
  >,

  confirmButtonType?: $PropertyType<
    ConfirmationDialogProps,
    'confirmButtonType',
  >,

  id: string,
  message?: $PropertyType<ConfirmationDialogProps, 'message'>,
  onConfirm: $PropertyType<ConfirmationDialogProps, 'onConfirm'>,
  puffyButtons?: $PropertyType<ConfirmationDialogProps, 'puffyButtons'>,
|};

type UIStateType = {|
  showConfirmation: boolean,
|};

const initialUIState: UIStateType = { showConfirmation: false };

type InternalProps = {|
  ...Props,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

export class ConfirmButtonBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    buttonType: 'neutral',
  };

  onConfirm: HTMLElementEventHandler = (e: ElementEvent) => {
    this.props.setUIState({ showConfirmation: false });
    this.props.onConfirm(e);
  };

  toggleConfirmation: HTMLElementEventHandler = (e: ElementEvent) => {
    e.preventDefault();

    this.props.setUIState({
      showConfirmation: !this.props.uiState.showConfirmation,
    });
  };

  render(): React.Node {
    const {
      buttonType,
      cancelButtonText,
      cancelButtonType,
      children,
      className,
      confirmButtonText,
      confirmButtonType,
      htmlType,
      id,
      message,
      onConfirm,
      puffyButtons,
      uiState,
    } = this.props;

    invariant(children, 'The children property is required');
    invariant(id, 'The id property is required');
    invariant(onConfirm, 'The onConfirm property is required');

    const { showConfirmation } = uiState;

    const classNames = makeClassName('ConfirmButton', className, {
      'ConfirmButton--show-confirmation': showConfirmation,
    });

    return (
      <div className={classNames}>
        {showConfirmation ? (
          <ConfirmationDialog
            cancelButtonText={cancelButtonText}
            cancelButtonType={cancelButtonType}
            confirmButtonText={confirmButtonText}
            confirmButtonType={confirmButtonType}
            onCancel={this.toggleConfirmation}
            onConfirm={this.onConfirm}
            message={message}
            puffyButtons={puffyButtons}
          />
        ) : (
          <Button
            buttonType={buttonType}
            htmlType={htmlType}
            className="ConfirmButton-default-button"
            onClick={this.toggleConfirmation}
          >
            {children}
          </Button>
        )}
      </div>
    );
  }
}

export const extractId = (ownProps: Props): string => {
  return ownProps.id;
};

const ConfirmButton: React.ComponentType<Props> = compose(
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
    resetOnUnmount: true,
  }),
)(ConfirmButtonBase);

export default ConfirmButton;
