/* @flow */
/* eslint-disable react/sort-comp */
import classNames from 'classnames';
import React from 'react';
import { compose } from 'redux';
import Textarea from 'react-textarea-autosize';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import type { ElementEvent } from 'core/types/dom';

import './styles.scss';

type StateType = {|
  text: string | null,
|};

export type OnSubmitParams = {|
  event: SyntheticEvent,
  text: $PropertyType<StateType, 'text'>,
|};

type PropTypes = {|
  className?: string,
  onDismiss: () => void,
  onSubmit: (params: OnSubmitParams) => void,
  i18n: Object,
  isSubmitting?: boolean,
  placeholder?: string,
  submitButtonText?: string,
  submitButtonInProgressText?: string,
  text?: string,
|};

// TODO: refactor ReportAbuseButton to use this?

/*
 * This renders a form with an auto-resizing textarea,
 * a submit button, and a link to dismiss the form.
 *
 * The parent component is responsible for controlling
 * the form. The main use case is that this form would
 * be shown and hidden, controlled by some other button but
 * the parent must do the showing and hiding.
 */
export class DismissibleTextFormBase extends React.Component {
  textarea: HTMLElement;
  props: PropTypes;
  state: StateType;

  static defaultProps = {
    isSubmitting: false,
  }

  constructor(props: PropTypes) {
    super(props);
    this.state = { text: props.text || null };
  }

  componentDidMount() {
    if (this.textarea) {
      this.textarea.focus();
    }
  }

  onDismiss = (event: SyntheticEvent) => {
    event.preventDefault();
    this.setState({ text: null });
    this.props.onDismiss();
  }

  onSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    this.props.onSubmit({ event, text: this.state.text });
  }

  onTextChange = (event: ElementEvent<HTMLInputElement>) => {
    event.preventDefault();
    this.setState({ text: event.target.value });
  }

  render() {
    const {
      className,
      i18n,
      isSubmitting,
      placeholder,
      submitButtonText,
      submitButtonInProgressText,
    } = this.props;

    const sendButtonIsDisabled = isSubmitting || !this.state.text;

    const text = {
      placeholder: placeholder || i18n.gettext('Enter text.'),
      submitButtonText: submitButtonText || i18n.gettext('Submit'),
      submitButtonInProgressText:
        submitButtonInProgressText || i18n.gettext('Submitting'),
    };

    return (
      <form
        className={classNames('DismissibleTextForm-form', className)}
        onSubmit={this.onSubmit}
      >
        <Textarea
          defaultValue={this.state.text}
          disabled={isSubmitting}
          className="DismissibleTextForm-textarea"
          inputRef={(ref) => { this.textarea = ref; }}
          onChange={this.onTextChange}
          placeholder={text.placeholder}
        />
        <div className="DismissibleTextForm-buttons">
          <a
            className={classNames('DismissibleTextForm-dismiss', {
              'DismissibleTextForm-dismiss--disabled': isSubmitting,
            })}
            href="#dismiss"
            onClick={this.onDismiss}
          >
            {i18n.gettext('Dismiss')}
          </a>
          <Button
            type="submit"
            className="DismissibleTextForm-submit Button--action Button--small"
            disabled={sendButtonIsDisabled}
          >
            {isSubmitting ?
              text.submitButtonInProgressText : text.submitButtonText
            }
          </Button>
        </div>
      </form>
    );
  }
}

export default compose(
  translate(),
)(DismissibleTextFormBase);
