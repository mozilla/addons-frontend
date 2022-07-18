import * as React from 'react';
import userEvent from '@testing-library/user-event';

import ConfirmationDialog from 'amo/components/ConfirmationDialog';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    return defaultRender(<ConfirmationDialog {...props} />);
  }

  it('renders a dialog', () => {
    const message = 'this action is risky, are you sure?';
    render({ message });

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveClass('ConfirmationDialog-confirm-button');
    expect(confirmButton).toHaveClass('Button--alert');

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toHaveClass('ConfirmationDialog-cancel-button');
    expect(cancelButton).toHaveClass('Button--cancel');
  });

  it('renders a custom className', () => {
    const className = 'MyComponent';
    render({ className });
    expect(screen.getByClassName('ConfirmationDialog')).toHaveClass(className);
  });

  it('can configure buttons as puffy', () => {
    render({ puffyButtons: true });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toHaveClass('ConfirmationDialog-cancel-button');
    expect(cancelButton).toHaveClass('Button--puffy');

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveClass('ConfirmationDialog-confirm-button');
    expect(confirmButton).toHaveClass('Button--puffy');
  });

  it('can configure buttons as non puffy', () => {
    render({ puffyButtons: false });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toHaveClass('ConfirmationDialog-cancel-button');
    expect(cancelButton).not.toHaveClass('Button--puffy');

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveClass('ConfirmationDialog-confirm-button');
    expect(confirmButton).not.toHaveClass('Button--puffy');
  });

  it('calls onConfirm() when user clicks Confirm', async () => {
    const onConfirm = jest.fn();
    render({ onConfirm });
    await userEvent.click(
      screen.getByClassName('ConfirmationDialog-confirm-button'),
    );
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel() when user clicks Cancel', async () => {
    const onCancel = jest.fn();
    render({ onCancel });
    await userEvent.click(
      screen.getByClassName('ConfirmationDialog-cancel-button'),
    );
    expect(onCancel).toHaveBeenCalled();
  });

  it('lets you configure the confirm button', () => {
    const confirmButtonText = 'Yes, do it!';

    render({ confirmButtonText, confirmButtonType: 'neutral' });
    expect(screen.getByText(confirmButtonText)).toHaveClass('Button--neutral');
  });

  it('lets you configure the cancel button', () => {
    const cancelButtonText = 'Nevermind, cancel';
    render({ cancelButtonText, cancelButtonType: 'neutral' });
    expect(screen.getByText(cancelButtonText)).toHaveClass('Button--neutral');
  });
});
