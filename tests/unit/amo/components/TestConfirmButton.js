import * as React from 'react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConfirmButton, { extractId } from 'amo/components/ConfirmButton';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultChildText = 'the default text of this button';

  const render = ({
    children = defaultChildText,
    message = 'some warning message',
    id = 'Some-confirm-button',
    onConfirm = jest.fn(),
    ...otherProps
  } = {}) => {
    return defaultRender(
      <ConfirmButton
        onConfirm={onConfirm}
        message={message}
        id={id}
        {...otherProps}
      >
        {children}
      </ConfirmButton>,
    );
  };

  const renderWithDialog = async ({ ...otherProps } = {}) => {
    render(otherProps);

    // Click to open ConfirmationDialog.
    userEvent.click(
      screen.getByRole('button', {
        name: defaultChildText,
      }),
    );
    await waitFor(() => expect(screen.getAllByRole('button')).toHaveLength(2));
  };

  it('renders a button', () => {
    render();

    const button = screen.getByRole('button', {
      name: defaultChildText,
    });
    expect(button).toHaveClass('ConfirmButton-default-button');
    expect(button).toHaveClass('Button--neutral');
  });

  it('passes the buttonType prop to the button', () => {
    render({ buttonType: 'alert' });

    expect(
      screen.getByRole('button', {
        name: defaultChildText,
      }),
    ).toHaveClass('Button--alert');
  });

  it('passes the children prop to the button', () => {
    const children = 'Do you really want to delete this?';
    render({ children });

    expect(screen.getByRole('button', { name: children })).toBeInTheDocument();
  });

  it('shows ConfirmationDialog when button is clicked', async () => {
    render();

    expect(screen.queryByText('some warning message')).not.toBeInTheDocument();

    userEvent.click(
      screen.getByRole('button', {
        name: defaultChildText,
      }),
    );

    expect(await screen.findByText('some warning message')).toBeInTheDocument();
  });

  it('configures ConfirmationDialog', async () => {
    const cancelButtonText = 'Nevermind, take me back';
    const confirmButtonText = 'Do it!';
    const message = 'Do you really want to cancel?';

    await renderWithDialog({
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
    expect(dialogCancelButton).toHaveClass('Button--alert');
    expect(dialogCancelButton).toHaveClass('Button--puffy');

    const dialogConfirmButton = screen.getByRole('button', {
      name: confirmButtonText,
    });
    expect(dialogConfirmButton).toHaveClass('Button--alert');
    expect(dialogConfirmButton).toHaveClass('Button--puffy');
  });

  it('hides the default button after it is clicked', async () => {
    render();

    const button = screen.getByRole('button', {
      name: defaultChildText,
    });
    userEvent.click(button);
    await waitFor(() => expect(button).not.toBeInTheDocument());
  });

  it('hides ConfirmationDialog on cancel', async () => {
    await renderWithDialog();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.getAllByRole('button')).toHaveLength(1));
  });

  it('handles onConfirm callback and hides ConfirmationDialog on confirm', async () => {
    const onConfirm = jest.fn();
    await renderWithDialog({ onConfirm });

    expect(screen.getAllByRole('button')).toHaveLength(2);

    userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.getAllByRole('button')).toHaveLength(1));
    expect(onConfirm).toHaveBeenCalled();
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'special-button';
      expect(extractId({ id })).toEqual(id);
    });
  });
});
