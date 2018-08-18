/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import Textarea from 'react-textarea-autosize';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import type { ElementEvent } from 'core/types/dom';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type State = {|
  initialText: string,
  text: string,
|};

export type OnSubmitParams = {|
  event: SyntheticEvent<any>,
  text: $PropertyType<State, 'text'>,
|};

type Props = {|
  className?: string,
  onDelete?: null | (() => void),
  onDismiss?: () => void,
  onSubmit: (params: OnSubmitParams) => void,
  isSubmitting?: boolean,
  microButtons?: boolean,
  placeholder?: string,
  puffyButtons?: boolean,
  submitButtonClassName?: string,
  submitButtonText?: string,
  submitButtonInProgressText?: string,
  text?: null | string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

/*
 * This renders a form with an auto-resizing textarea,
 * a submit button, a link to dismiss the form, and optionally
 * a delete button.
 *
 * The parent component is responsible for controlling
 * the form. The main use case is that this form would
 * be shown and hidden, controlled by some other button but
 * the parent must do the showing and hiding.
 */
export class DismissibleTextFormBase extends React.Component<
  InternalProps,
  State,
> {
  textarea: React.ElementRef<typeof Textarea>;

  static defaultProps = {
    isSubmitting: false,
    microButtons: false,
    puffyButtons: false,
  };

  constructor(props: InternalProps) {
    super(props);
    const initialText = props.text || '';
    this.state = { initialText, text: initialText };
  }

  componentDidMount() {
    if (this.textarea) {
      this.textarea.focus();
    }
  }

  onDelete = (event: SyntheticEvent<any>) => {
    event.preventDefault();

    invariant(this.props.onDelete, 'onDelete() is not defined');
    this.props.onDelete();
  };

  onDismiss = (event: SyntheticEvent<any>) => {
    const { onDismiss } = this.props;
    event.preventDefault();
    invariant(onDismiss, 'onDismiss() is required');

    onDismiss();
  };

  onSubmit = (event: SyntheticEvent<any>) => {
    event.preventDefault();
    this.props.onSubmit({ event, text: this.state.text });
  };

  onTextChange = (event: ElementEvent<HTMLInputElement>) => {
    event.preventDefault();
    this.setState({ text: event.target.value });
  };

  render() {
    const {
      className,
      i18n,
      isSubmitting,
      microButtons,
      onDelete,
      onDismiss,
      placeholder,
      puffyButtons,
      submitButtonClassName,
      submitButtonText,
      submitButtonInProgressText,
    } = this.props;

    const submitButtonIsDisabled =
      isSubmitting ||
      !this.state.text.trim() ||
      this.state.initialText === this.state.text;
    const deleteButtonIsDisabled = !this.state.text.trim();

    const text = {
      placeholder: placeholder || i18n.gettext('Enter text.'),
      submitButtonText: submitButtonText || i18n.gettext('Submit'),
      submitButtonInProgressText:
        submitButtonInProgressText || i18n.gettext('Submitting'),
    };

    invariant(
      !(microButtons && puffyButtons),
      'microButtons and puffyButtons cannot both be true; choose one',
    );

    return (
      <form className={makeClassName('DismissibleTextForm-form', className)}>
        <Textarea
          defaultValue={this.state.text}
          disabled={isSubmitting}
          className="DismissibleTextForm-textarea"
          inputRef={(ref) => {
            this.textarea = ref;
          }}
          onChange={this.onTextChange}
          placeholder={text.placeholder}
        />
        <div className="DismissibleTextForm-buttons">
          {/*
            These buttons each have an href so that they become anchor tags.
            This prevents mobile taps from triggering their hover styles.
          */}
          {onDismiss && (
            <Button
              href="#cancel"
              onClick={this.onDismiss}
              className="DismissibleTextForm-dismiss"
              disabled={isSubmitting}
              type="cancel"
            >
              {i18n.gettext('Cancel')}
            </Button>
          )}
          <span className="DismissibleTextForm-delete-submit-buttons">
            {onDelete && (
              <Button
                buttonType="alert"
                className="DismissibleTextForm-delete"
                disabled={deleteButtonIsDisabled}
                href="#delete"
                onClick={this.onDelete}
                micro={microButtons}
                puffy={puffyButtons}
              >
                {i18n.gettext('Delete')}
              </Button>
            )}
            <Button
              buttonType="action"
              className={makeClassName(
                'DismissibleTextForm-submit',
                submitButtonClassName,
              )}
              disabled={submitButtonIsDisabled}
              href="#submit"
              onClick={this.onSubmit}
              micro={microButtons}
              puffy={puffyButtons}
            >
              {isSubmitting
                ? text.submitButtonInProgressText
                : text.submitButtonText}
            </Button>
          </span>
        </div>
      </form>
    );
  }
}

const DismissibleTextForm: React.ComponentType<Props> = compose(translate())(
  DismissibleTextFormBase,
);

export default DismissibleTextForm;
