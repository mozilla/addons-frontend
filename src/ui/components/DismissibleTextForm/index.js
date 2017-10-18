/* @flow */
/* eslint-disable react/sort-comp */
/* global $PropertyType */
import classNames from 'classnames';
import * as React from 'react';
import { compose } from 'redux';
import Textarea from 'react-textarea-autosize';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import type { ElementEvent } from 'core/types/dom';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type State = {|
  text: string,
|};

export type OnSubmitParams = {|
  event: SyntheticEvent<any>,
  text: $PropertyType<State, 'text'>,
|};

type Props = {|
  className?: string,
  onDismiss: () => void,
  onSubmit: (params: OnSubmitParams) => void,
  i18n: I18nType,
  isSubmitting?: boolean,
  placeholder?: string,
  submitButtonClassName?: string,
  submitButtonText?: string,
  submitButtonInProgressText?: string,
  text?: string,
|};

/*
 * This renders a form with an auto-resizing textarea,
 * a submit button, and a link to dismiss the form.
 *
 * The parent component is responsible for controlling
 * the form. The main use case is that this form would
 * be shown and hidden, controlled by some other button but
 * the parent must do the showing and hiding.
 */
export class DismissibleTextFormBase extends React.Component<Props, State> {
  textarea: React.ElementRef<typeof Textarea>;

  static defaultProps = {
    isSubmitting: false,
  }

  constructor(props: Props) {
    super(props);
    this.state = { text: props.text || '' };
  }

  componentDidMount() {
    if (this.textarea) {
      this.textarea.focus();
    }
  }

  onDismiss = (event: SyntheticEvent<any>) => {
    event.preventDefault();
    this.setState({ text: '' });
    this.props.onDismiss();
  }

  onSubmit = (event: SyntheticEvent<any>) => {
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
      submitButtonClassName,
      submitButtonText,
      submitButtonInProgressText,
    } = this.props;

    const submitButtonIsDisabled = isSubmitting || !this.state.text.trim();

    const text = {
      placeholder: placeholder || i18n.gettext('Enter text.'),
      submitButtonText: submitButtonText || i18n.gettext('Submit'),
      submitButtonInProgressText:
        submitButtonInProgressText || i18n.gettext('Submitting'),
    };

    return (
      <form
        className={classNames('DismissibleTextForm-form', className)}
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
          {/*
            These buttons each have an href so that they become anchor tags.
            This prevents mobile taps from triggering their hover styles.
          */}
          <Button
            href="#cancel"
            onClick={this.onDismiss}
            className={classNames(
              'DismissibleTextForm-dismiss',
              'Button--cancel',
              'Button--wide',
            )}
            disabled={isSubmitting}
          >
            {i18n.gettext('Cancel')}
          </Button>
          <Button
            href="#submit"
            onClick={this.onSubmit}
            className={classNames(
              'DismissibleTextForm-submit',
              'Button--action',
              'Button--wide',
              submitButtonClassName,
            )}
            disabled={submitButtonIsDisabled}
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
