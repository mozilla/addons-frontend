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

    expect(screen.getByText(message)).toHaveClass('ConfirmationDialog-message');
    /*
    expect(root.find(Button)).toHaveLength(2);

    const confirmButton = root.find(Button).at(0);
    expect(confirmButton).toHaveClassName('ConfirmationDialog-confirm-button');
    expect(confirmButton).toHaveProp('buttonType', 'alert');
    expect(confirmButton.children()).toHaveText('Confirm');

    const cancelButton = root.find(Button).at(1);
    expect(cancelButton).toHaveClassName('ConfirmationDialog-cancel-button');
    expect(cancelButton).toHaveProp('buttonType', 'cancel');
    expect(cancelButton.children()).toHaveText('Cancel');
    */
  });

  it('renders a custom className', () => {
    const className = 'MyComponent';
    render({ className });
    expect(screen.getByClassName(className)).toHaveClass('ConfirmationDialog');
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

  it('calls onConfirm() when user clicks Confirm', () => {
    const onConfirm = jest.fn();
    render({ onConfirm });
    const button = screen.getByClassName('ConfirmationDialog-confirm-button');
    userEvent.click(button);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel() when user clicks Cancel', () => {
    const onCancel = jest.fn();
    render({ onCancel });
    const button = screen.getByClassName('ConfirmationDialog-cancel-button');
    userEvent.click(button);
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
