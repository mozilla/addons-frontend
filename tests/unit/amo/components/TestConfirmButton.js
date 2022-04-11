import * as React from 'react';
import userEvent from '@testing-library/user-event';

import ConfirmButton, { extractId } from 'amo/components/ConfirmButton';
import {
  dispatchClientMetadata,
  fakeI18n,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const getProps = ({ i18n = fakeI18n(), ...props } = {}) => {
    return {
      i18n,
      id: 'Collection-confirm-delete',
      message: 'some warning message',
      onConfirm: sinon.stub(),
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  const render = ({ children, ...otherProps } = {}) => {
    return defaultRender(
      <ConfirmButton {...getProps(otherProps)}>
        {children || 'the default text of this button'}
      </ConfirmButton>,
    );
  };

  const renderWithDialog = ({ ...otherProps } = {}) => {
    render(otherProps);

    // Click to open ConfirmationDialog.
    const button = screen.getByRole('button', {
      name: 'the default text of this button',
    });
    userEvent.click(button);
    expect(screen.getByClassName('ConfirmationDialog')).toBeInTheDocument();
  };

  it('renders a button', () => {
    render();

    const button = screen.getByRole('button', {
      name: 'the default text of this button',
    });
    expect(button).toHaveClass('ConfirmButton-default-button');
    expect(button).toHaveClass('Button--neutral');
  });

  it('passes the buttonType prop to the button', () => {
    render({ buttonType: 'alert' });

    const button = screen.getByRole('button', {
      name: 'the default text of this button',
    });
    expect(button).toHaveClass('ConfirmButton-default-button');
    expect(button).toHaveClass('Button--alert');
  });

  it('passes the children prop to the button', () => {
    render({ children: 'Do you really want to delete this?' });

    const button = screen.getByRole('button', {
      name: 'Do you really want to delete this?',
    });
    expect(button).toHaveClass('ConfirmButton-default-button');
    expect(button).toHaveClass('Button--neutral');
  });

  it('shows ConfirmationDialog when button is clicked', () => {
    render();
    const button = screen.getByRole('button', {
      name: 'the default text of this button',
    });

    expect(
      screen.queryByClassName('ConfirmButton--show-confirmation'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('some warning message')).not.toBeInTheDocument();

    userEvent.click(button);

    expect(screen.getByText('some warning message')).toBeInTheDocument();
    expect(screen.getByClassName('ConfirmationDialog')).toBeInTheDocument();
    expect(
      screen.getByClassName('ConfirmButton--show-confirmation'),
    ).toBeInTheDocument();
  });

  it('configures ConfirmationDialog', () => {
    const cancelButtonText = 'Nevermind, take me back';
    const confirmButtonText = 'Do it!';
    const message = 'Do you really want to cancel?';

    renderWithDialog({
      cancelButtonText,
      cancelButtonType: 'alert',
      confirmButtonText,
      confirmButtonType: 'alert',
      message,
      puffyButtons: true,
    });

    expect(screen.getByText(message)).toBeInTheDocument();

    const dialogCancelButton = screen.getByRole('button', {
      name: cancelButtonText,
    });
    expect(dialogCancelButton).toHaveClass('ConfirmationDialog-cancel-button');
    expect(dialogCancelButton).toHaveClass('Button--alert');
    expect(dialogCancelButton).toHaveClass('Button--puffy');

    const dialogConfirmButton = screen.getByRole('button', {
      name: confirmButtonText,
    });
    expect(dialogConfirmButton).toHaveClass(
      'ConfirmationDialog-confirm-button',
    );
    expect(dialogConfirmButton).toHaveClass('Button--alert');
    expect(dialogConfirmButton).toHaveClass('Button--puffy');
  });

  it('hides the default button after it is clicked', () => {
    render();

    const button = screen.getByRole('button', {
      name: 'the default text of this button',
    });
    userEvent.click(button);
    expect(button).not.toBeInTheDocument();
  });

  it('handles onCancel callback and hides ConfirmationDialog on cancel', () => {
    const onCancel = jest.fn();
    renderWithDialog({ onCancel });

    expect(
      screen.getByClassName('ConfirmButton--show-confirmation'),
    ).toBeInTheDocument();

    userEvent.click(screen.getByClassName('ConfirmationDialog-cancel-button'));

    expect(
      screen.queryByClassName('ConfirmButton--show-confirmation'),
    ).not.toBeInTheDocument();
    expect(onCancel).toHaveBeenCalled();
  });

  it('handles onConfirm callback and hides ConfirmationDialog on confirm', () => {
    const onConfirm = jest.fn();
    renderWithDialog({ onConfirm });

    expect(
      screen.getByClassName('ConfirmButton--show-confirmation'),
    ).toBeInTheDocument();

    userEvent.click(screen.getByClassName('ConfirmationDialog-confirm-button'));

    expect(
      screen.queryByClassName('ConfirmButton--show-confirmation'),
    ).not.toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalled();
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'special-button';
      expect(extractId(getProps({ id }))).toEqual(id);
    });
  });
});
