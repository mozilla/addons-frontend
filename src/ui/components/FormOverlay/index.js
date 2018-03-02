/* @flow */
/* eslint-disable react/sort-comp */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { closeFormOverlay } from 'core/reducers/formOverlay';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { FormOverlayState } from 'core/reducers/formOverlay';

import './styles.scss';

type Props = {|
  children?: React.Node,
  className?: string,
  dispatch: DispatchFunc,
  i18n: I18nType,
  id: string,
  isOpen: boolean,
  isSubmitting: boolean,
  onCancel?: Function,
  onSubmit?: Function,
  submitText?: string,
  submittingText?: string,
  title: string,
|};

export class FormOverlayBase extends React.Component<Props> {
  static defaultProps = {
    isOpen: false,
  };

  closeOverlay(event: SyntheticEvent<any>) {
    const { id, dispatch } = this.props;
    event.preventDefault();
    event.stopPropagation();
    dispatch(closeFormOverlay(id));
  }

  onClickBackground = (event: SyntheticEvent<any>) => {
    this.closeOverlay(event);
  }

  onClickExIcon = (event: SyntheticEvent<any>) => {
    this.closeOverlay(event);
  }

  onClickOverlay = (event: SyntheticEvent<any>) => {
    // Prevent the click event from propagating to parent elements.
    // This stops the overlay from closing when clicking inside it.
    event.stopPropagation();
  }

  onCancel = (event: SyntheticEvent<any>) => {
    const { onCancel } = this.props;
    if (onCancel) {
      onCancel();
    }
    this.closeOverlay(event);
  }

  onSubmit = (event: SyntheticEvent<any>) => {
    const { onSubmit } = this.props;
    event.preventDefault();
    event.stopPropagation();
    if (onSubmit) {
      onSubmit();
    }
  }

  render() {
    const {
      children,
      className,
      i18n,
      isOpen,
      isSubmitting,
      submitText,
      submittingText,
      title,
    } = this.props;

    if (!isOpen) {
      return null;
    }

    let formIsDisabled = false;
    let submitPrompt;
    if (isSubmitting) {
      formIsDisabled = true;
      submitPrompt = submittingText || i18n.gettext('Submitting');
    } else {
      submitPrompt = submitText || i18n.gettext('Submit');
    }

    return (
      <div
        onClick={this.onClickBackground}
        className={makeClassName('FormOverlay', className)}
        role="presentation"
      >
        <div
          onClick={this.onClickOverlay}
          className="FormOverlay-overlay"
          role="presentation"
        >
          <div className="FormOverlay-close-control">
            <Button
              className="FormOverlay-close-button"
              onClick={this.onClickExIcon}
            >
              <Icon name="x-mark" alt={i18n.gettext('Click to close')} />
            </Button>
          </div>
          <h3 className="FormOverlay-h3">{title}</h3>
          <div className="FormOverlay-form">
            <form>
              {children}
              <div className="FormOverlay-form-buttons">
                {/*
                  type=button is necessary to override the default
                  of type=submit
                */}
                <Button
                  buttonType="neutral"
                  disabled={formIsDisabled}
                  onClick={this.onCancel}
                  className="FormOverlay-cancel"
                  puffy
                  type="button"
                >
                  {i18n.gettext('Cancel')}
                </Button>
                <Button
                  buttonType="action"
                  disabled={formIsDisabled}
                  className="FormOverlay-submit"
                  onClick={this.onSubmit}
                  type="submit"
                  puffy
                >
                  {submitPrompt}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (
  state: {| formOverlay: FormOverlayState |}, ownProps: Props
): $Shape<Props> => {
  const overlayState = state.formOverlay[ownProps.id];

  if (!overlayState) {
    return {};
  }

  return {
    isOpen: overlayState.open,
    isSubmitting: overlayState.submitting,
  };
};

export default compose(
  translate(),
  connect(mapStateToProps)
)(FormOverlayBase);
