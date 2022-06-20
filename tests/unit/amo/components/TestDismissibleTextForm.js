import * as React from 'react';
import { createEvent, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DismissibleTextForm from 'amo/components/DismissibleTextForm';
import {
  createFakeDebounce,
  createFakeLocalState,
  dispatchClientMetadata,
  render as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  const renderProps = (customProps = {}) => {
    return {
      _createLocalState: createFakeLocalState,
      _debounce: createFakeDebounce(),
      id: 'any-form-id',
      onDelete: null,
      onDismiss: jest.fn(),
      onSubmit: jest.fn(),
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = renderProps(customProps);
    return defaultRender(<DismissibleTextForm {...props} />, { store });
  };

  const getTextBox = () => screen.getByRole('textbox');

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('can be configured with a custom class', () => {
    render({ className: 'some-class' });

    expect(screen.getByTagName('form')).toHaveClass('some-class');
  });

  it('lets you configure the submit button class', () => {
    render({ submitButtonClassName: 'my-class' });

    expect(screen.getByRole('button', { name: 'Submit' })).toHaveClass(
      'my-class',
    );
  });

  it('renders a default cancel button', () => {
    render({ dismissButtonText: undefined });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('lets you configure the cancel button text', () => {
    const dismissButtonText = 'Nevermind, cancel it';
    render({ dismissButtonText });

    expect(
      screen.getByRole('button', { name: dismissButtonText }),
    ).toBeInTheDocument();
  });

  it('renders a placeholder', () => {
    render({ placeholder: 'Enter some text' });

    expect(screen.getByPlaceholderText('Enter some text')).toBeInTheDocument();
  });

  it('lets you render text', () => {
    render({ text: 'Some text to edit' });

    expect(getTextBox()).toHaveValue('Some text to edit');
  });

  it('calls back when dismissing the textarea', () => {
    const onDismiss = jest.fn();
    render({ onDismiss });

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('clears the form onDismiss', () => {
    render({ onDismiss: jest.fn() });

    userEvent.type(getTextBox(), 'Example text');
    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(getTextBox()).toHaveValue('');
  });

  it('calls back when submitting the form', () => {
    const onSubmit = jest.fn();
    render({ onSubmit });
    const enteredText = 'Some review text';

    userEvent.type(getTextBox(), enteredText);
    userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: enteredText,
      }),
    );
  });

  it('lets you configure the submit button text', () => {
    render({
      submitButtonText: 'Submit the form',
    });

    expect(
      screen.getByRole('button', { name: 'Submit the form' }),
    ).toBeInTheDocument();
  });

  it('lets you configure the in-progress submit button text', () => {
    render({
      submitButtonInProgressText: 'Submitting the form',
      isSubmitting: true,
    });

    expect(
      screen.getByRole('button', { name: 'Submitting the form' }),
    ).toBeInTheDocument();
  });

  it('disables the submit button while submitting the form', () => {
    render({ isSubmitting: true, text: 'Some text' });

    expect(screen.getByRole('button', { name: 'Submitting' })).toBeDisabled();
  });

  it('disables the submit button before text has been entered', () => {
    render({ text: '' });

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('disables submit button before non-empty text has been entered', () => {
    // Enter only white space:
    render({ text: '    ' });

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('disables submit button before the text has changed', () => {
    render({ text: 'Some text' });

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('disables the dismiss button while submitting the form', () => {
    render({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('enables the dismiss button while not submitting the form', () => {
    render({ isSubmitting: false });

    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled();
  });

  it('enables the submit button after text has been entered', () => {
    render({ text: '' });

    userEvent.type(getTextBox(), 'Typing some text...');

    expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
  });

  it('disables the submit button when updating with whitespaces', () => {
    render({ text: 'Some Text' });

    userEvent.type(getTextBox(), '   ');

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('disables the textarea when submitting the form', () => {
    render({ isSubmitting: true });

    expect(getTextBox()).toBeDisabled();
  });

  it('enables the textarea when not submitting the form', () => {
    render({ isSubmitting: false });

    expect(getTextBox()).not.toBeDisabled();
  });

  it('hides the delete button when onDelete is empty', () => {
    render({ onDelete: null });

    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('displays the delete button when onDelete is provided', () => {
    render({ onDelete: jest.fn() });

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'Button--alert',
    );
  });

  it('creates micro buttons when requested', () => {
    render({
      microButtons: true,
      onDelete: jest.fn(),
      onDismiss: jest.fn(),
    });

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'Button--micro',
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveClass(
      'Button--micro',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'Button--micro',
    );
  });

  it('creates puffy buttons when requested', () => {
    render({
      onDelete: jest.fn(),
      onDismiss: jest.fn(),
      puffyButtons: true,
    });

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'Button--puffy',
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveClass(
      'Button--puffy',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'Button--puffy',
    );
  });

  it('creates non-micro, non-puffy buttons by default', () => {
    render({
      onDismiss: jest.fn(),
      onDelete: jest.fn(),
    });

    expect(screen.getByRole('button', { name: 'Delete' })).not.toHaveClass(
      'Button--micro',
    );
    expect(screen.getByRole('button', { name: 'Submit' })).not.toHaveClass(
      'Button--micro',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toHaveClass(
      'Button--micro',
    );
    expect(screen.getByRole('button', { name: 'Delete' })).not.toHaveClass(
      'Button--puffy',
    );
    expect(screen.getByRole('button', { name: 'Submit' })).not.toHaveClass(
      'Button--puffy',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toHaveClass(
      'Button--puffy',
    );
  });

  it('cannot create conflicting button types', () => {
    expect(() => {
      render({ puffyButtons: true, microButtons: true });
    }).toThrow(/microButtons and puffyButtons cannot both be true/);
  });

  it('disables the delete button when there is no text', () => {
    render({ onDelete: jest.fn(), text: '' });

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('enables the delete button after text has been entered', () => {
    render({ onDelete: jest.fn(), text: '' });

    userEvent.type(getTextBox(), 'Typing some text...');

    expect(screen.getByRole('button', { name: 'Delete' })).not.toBeDisabled();
  });

  it('calls back when clicking the delete button', () => {
    const onDelete = jest.fn();
    render({ onDelete });

    userEvent.type(getTextBox(), 'Some review text');

    // Submit the form.
    const button = screen.getByRole('button', { name: 'Delete' });
    const clickEvent = createEvent.click(button);
    const preventDefaultWatcher = jest.spyOn(clickEvent, 'preventDefault');

    fireEvent(button, clickEvent);

    expect(preventDefaultWatcher).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  it('can hide the cancel/dismiss button', () => {
    render({ onDismiss: undefined });

    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
  });

  it('hides a formFooter by default', () => {
    render();

    expect(
      screen.queryByClassName('DismissibleTextForm-formFooter'),
    ).not.toBeInTheDocument();
  });

  it('renders a formFooter', () => {
    const footerText = 'Some footer text';
    render({ formFooter: <div>{footerText}</div> });

    expect(
      within(screen.getByClassName('DismissibleTextForm-formFooter')).getByText(
        footerText,
      ),
    ).toBeInTheDocument();
  });

  it('renders all buttons in a default order', () => {
    render({
      onDelete: jest.fn(),
      onDismiss: jest.fn(),
    });

    const allButtons = screen.getAllByRole('button');
    expect(allButtons[0]).toHaveTextContent('Cancel');
    expect(allButtons[1]).toHaveTextContent('Delete');
    expect(allButtons[2]).toHaveTextContent('Submit');
  });

  it('can reverse the button order', () => {
    render({
      onDelete: jest.fn(),
      onDismiss: jest.fn(),
      reverseButtonOrder: true,
    });

    const allButtons = screen.getAllByRole('button');
    expect(allButtons[0]).toHaveTextContent('Submit');
    expect(allButtons[1]).toHaveTextContent('Delete');
    expect(allButtons[2]).toHaveTextContent('Cancel');
  });

  describe('LocalState', () => {
    // TODO: I don't think we want to be testing the internals of LocalState,
    // but rather just if it works as expected.
    // We might be able to do that by typing something and then unmounting and
    // then rendering again.
    it('configures LocalState', () => {
      const _createLocalState = jest.fn(createFakeLocalState);
      const id = 'some-form-id';

      render({ id, _createLocalState });

      expect(_createLocalState).toHaveBeenCalledWith(id);
    });

    it('loads LocalState on mount', () => {
      const loadSpy = jest.fn(() => Promise.resolve(null));
      render({
        _createLocalState: () => createFakeLocalState({ load: loadSpy }),
      });

      expect(loadSpy).toHaveBeenCalled();
    });

    it('populates the form with text from LocalState', async () => {
      const text = 'Some text that was saved to LocalState';
      render({
        _createLocalState: () =>
          createFakeLocalState({ load: () => Promise.resolve({ text }) }),
      });

      await waitFor(() => expect(getTextBox()).toHaveValue(text));
    });

    it('does not populate the form with null data', async () => {
      const text = 'Some initial text';
      render({
        _createLocalState: () =>
          // Set up LocalState to load null data.
          createFakeLocalState({ load: () => Promise.resolve(null) }),
        text,
      });

      expect(getTextBox()).toHaveValue(text);

      // The text box is focussed after checkForStoredState has been called.
      await waitFor(() => expect(getTextBox()).toHaveClass('focus-visible'));

      // Make sure the text was not erased.
      expect(getTextBox()).toHaveValue(text);
    });

    it('saves to LocalState when typing', () => {
      const saveSpy = jest.fn(() => Promise.resolve());
      render({
        _createLocalState: () => createFakeLocalState({ save: saveSpy }),
      });

      const text = 'Example text';
      userEvent.type(getTextBox(), text);

      expect(saveSpy).toHaveBeenCalledWith({ text });
    });

    it('clears LocalState onDismiss', () => {
      const clearSpy = jest.fn(() => Promise.resolve());
      render({
        _createLocalState: () => createFakeLocalState({ clear: clearSpy }),
        onDismiss: jest.fn(),
      });

      userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(clearSpy).toHaveBeenCalled();
    });

    it('clears LocalState onDelete', () => {
      const clearSpy = jest.fn(() => Promise.resolve());
      render({
        _createLocalState: () => createFakeLocalState({ clear: clearSpy }),
        onDelete: jest.fn(),
      });

      userEvent.type(getTextBox(), 'something');
      userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(clearSpy).toHaveBeenCalled();
    });

    it('clears LocalState onSubmit', () => {
      const clearSpy = jest.fn(() => Promise.resolve());
      render({
        _createLocalState: () => createFakeLocalState({ clear: clearSpy }),
        onSubmit: jest.fn(),
      });

      userEvent.type(getTextBox(), 'something');
      userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      expect(clearSpy).toHaveBeenCalled();
    });
  });
});
