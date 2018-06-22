/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  buttonType?: string,
  cancelButtonText?: string | null,
  cancelButtonType?: string,
  children: React.Element<any>,
  className?: string,
  confirmButtonText?: string | null,
  confirmButtonType?: string,
  message: string,
  onConfirm: Function,
|};

type InjectedProps = {|
  i18n: I18nType,
|};

type State = {|
  showConfirmation: boolean,
|};

type InternalProps = { ...Props, ...InjectedProps };

export class ConfirmButtonBase extends React.Component<InternalProps, State> {
  static defaultProps = {
    buttonType: 'neutral',
    cancelButtonText: null,
    cancelButtonType: 'cancel',
    confirmButtonText: null,
    confirmButtonType: 'alert',
  };

  constructor(props: InternalProps) {
    super(props);

    this.state = {
      showConfirmation: false,
    };
  }

  onConfirm = (e: SyntheticEvent<HTMLButtonElement>) => {
    this.setState({ showConfirmation: false });
    this.props.onConfirm(e);
  }

  toggleConfirmation = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();

    this.setState((prevState) => ({
      showConfirmation: !prevState.showConfirmation,
    }));
  }

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
      message,
    } = this.props;

    const { showConfirmation } = this.state;

    const classNames = makeClassName('ConfirmButton', className, {
      'ConfirmButton--show-confirmation': showConfirmation,
    });

    if (showConfirmation) {
      return (
        <div className={classNames}>
          <span className="ConfirmButton-message">
            {message}
          </span>

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

const ConfirmButton: React.ComponentType<Props> = compose(
  translate(),
)(ConfirmButtonBase);

export default ConfirmButton;
