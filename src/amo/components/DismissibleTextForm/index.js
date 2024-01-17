/* @flow */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import debounce from 'lodash.debounce';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import Textarea from 'react-textarea-autosize';

import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import createLocalState, { LocalState } from 'amo/localState';
import Button from 'amo/components/Button';
import type {
  ElementEvent,
  HTMLElementEventHandler,
  TypedElementEvent,
} from 'amo/types/dom';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type State = {|
  initialText: string,
  text: string,
|};

export type OnSubmitParams = {|
  event: ElementEvent,
  text: $PropertyType<State, 'text'>,
|};

type DefaultProps = {|
  _createLocalState?: typeof createLocalState,
  _debounce?: typeof debounce,
  isSubmitting?: boolean,
  microButtons?: boolean,
  puffyButtons?: boolean,
  reverseButtonOrder?: boolean,
|};

type Props = {|
  ...DefaultProps,
  className?: string,
  dismissButtonText?: string,
  formFooter?: React.Node,
  id: string,
  onDelete?: null | (() => void),
  onDismiss?: () => void,
  onSubmit: (params: OnSubmitParams) => void,
  placeholder?: string,
  submitButtonClassName?: string,
  submitButtonText?: string,
  submitButtonInProgressText?: string,
  text?: null | string,
|};

type InternalProps = {|
  ...Props,
  _createLocalState: typeof createLocalState,
  _debounce: typeof debounce,
  jed: I18nType,
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
  localState: LocalState;

  textarea: React.ElementRef<typeof Textarea>;

  static defaultProps: DefaultProps = {
    _createLocalState: createLocalState,
    _debounce: debounce,
    isSubmitting: false,
    microButtons: false,
    puffyButtons: false,
    reverseButtonOrder: false,
  };

  constructor(props: InternalProps) {
    super(props);
    const initialText = props.text || '';
    this.state = { initialText, text: initialText };
    this.localState = this.createLocalState();
  }

  componentDidMount() {
    this.checkForStoredState();
    if (this.textarea) {
      this.textarea.focus();
    }
  }

  componentDidUpdate(prevProps: InternalProps) {
    if (this.props.id !== prevProps.id) {
      this.localState = this.createLocalState();
      this.checkForStoredState();
    }
  }

  createLocalState(): LocalState {
    const { _createLocalState, id } = this.props;
    return _createLocalState(id);
  }

  async checkForStoredState() {
    const storedState: State | null = await this.localState.load();
    if (storedState) {
      log.debug(
        oneLine`Initializing DismissibleTextForm state from LocalState
          ${this.localState.id}`,
        storedState,
      );
      this.setState(storedState);
    }
  }

  onDelete: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    invariant(this.props.onDelete, 'onDelete() is not defined');
    this.props.onDelete();
    this.localState.clear();
  };

  onDismiss: HTMLElementEventHandler = (event: ElementEvent) => {
    const { onDismiss } = this.props;
    event.preventDefault();
    invariant(onDismiss, 'onDismiss() is required');

    onDismiss();
    this.setState({ text: '' });
    this.localState.clear();
  };

  onSubmit: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();
    this.props.onSubmit({ event, text: this.state.text });
    this.localState.clear();
  };

  persistState: typeof debounce = this.props._debounce(
    (state) => {
      // After a few keystrokes, save the text to a local store
      // so we can recover from crashes.
      this.localState.save(state);
    },
    800,
    { trailing: true },
  );

  onTextChange: (event: TypedElementEvent<HTMLInputElement>) => void = (
    event: TypedElementEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();

    const newState = { text: event.target.value };
    this.setState(newState);
    this.persistState(newState);
  };

  render(): React.Node {
    const {
      className,
      dismissButtonText,
      formFooter,
      jed,
      isSubmitting,
      microButtons,
      onDelete,
      onDismiss,
      placeholder,
      puffyButtons,
      reverseButtonOrder,
      submitButtonClassName,
      submitButtonText,
      submitButtonInProgressText,
    } = this.props;

    const submitButtonIsDisabled =
      isSubmitting ||
      !this.state.text.trim() ||
      this.state.initialText === this.state.text.trim();
    const deleteButtonIsDisabled = !this.state.text.trim();

    const text = {
      placeholder: placeholder || jed.gettext('Enter text.'),
      submitButtonText: submitButtonText || jed.gettext('Submit'),
      submitButtonInProgressText:
        submitButtonInProgressText || jed.gettext('Submitting'),
    };

    invariant(
      !(microButtons && puffyButtons),
      'microButtons and puffyButtons cannot both be true; choose one',
    );

    const cancelButton = onDismiss ? (
      <Button
        buttonType="neutral"
        className="DismissibleTextForm-dismiss"
        disabled={isSubmitting}
        key="cancel"
        micro={microButtons}
        onClick={this.onDismiss}
        puffy={puffyButtons}
        type="cancel"
      >
        {dismissButtonText || jed.gettext('Cancel')}
      </Button>
    ) : null;

    const deleteButton = onDelete ? (
      <Button
        buttonType="alert"
        className="DismissibleTextForm-delete"
        disabled={deleteButtonIsDisabled}
        key="delete"
        onClick={this.onDelete}
        micro={microButtons}
        puffy={puffyButtons}
        type="button"
      >
        {jed.gettext('Delete')}
      </Button>
    ) : null;

    const submitButton = (
      <Button
        buttonType="action"
        className={makeClassName(
          'DismissibleTextForm-submit',
          submitButtonClassName,
        )}
        disabled={submitButtonIsDisabled}
        key="submit"
        onClick={this.onSubmit}
        micro={microButtons}
        puffy={puffyButtons}
        type="submit"
      >
        {isSubmitting ? text.submitButtonInProgressText : text.submitButtonText}
      </Button>
    );

    const actionButtons = [deleteButton, submitButton];
    if (reverseButtonOrder) {
      actionButtons.reverse();
    }

    const actionButtonsContainer = (
      <span
        className="DismissibleTextForm-delete-submit-buttons"
        key="actionButtons"
      >
        {actionButtons}
      </span>
    );

    const allButtons = [cancelButton, actionButtonsContainer];
    if (reverseButtonOrder) {
      allButtons.reverse();
    }

    return (
      <form className={makeClassName('DismissibleTextForm-form', className)}>
        <Textarea
          disabled={isSubmitting}
          className="DismissibleTextForm-textarea"
          ref={(ref) => {
            this.textarea = ref;
          }}
          onChange={this.onTextChange}
          placeholder={text.placeholder}
          value={this.state.text}
        />
        {formFooter && (
          <div className="DismissibleTextForm-formFooter">{formFooter}</div>
        )}
        <div className="DismissibleTextForm-buttons">{allButtons}</div>
      </form>
    );
  }
}

const DismissibleTextForm: React.ComponentType<Props> = compose(translate())(
  DismissibleTextFormBase,
);

export default DismissibleTextForm;
