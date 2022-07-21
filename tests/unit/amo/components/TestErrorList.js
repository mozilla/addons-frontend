import * as React from 'react';
import userEvent from '@testing-library/user-event';

import { API_ERRORS_SESSION_EXPIRY } from 'amo/constants';
import ErrorList from 'amo/components/ErrorList';
import { render as defaultRender, screen } from 'tests/unit/helpers';

function render(customProps = {}) {
  const props = {
    messages: [],
    _window: { location: { reload: jest.fn() } },
    ...customProps,
  };
  return defaultRender(<ErrorList {...props} />);
}

describe(__filename, () => {
  it('supports a custom class name', () => {
    const className = 'MyClass';
    render({ className });

    const errorList = screen.getByRole('list');
    expect(errorList).toHaveClass('MyClass');
    expect(errorList).toHaveClass('ErrorList');
  });

  it('renders a message', () => {
    const message = 'Some error';
    render({ messages: [message] });

    expect(screen.getByClassName('Notice-error')).toHaveTextContent(message);
  });

  it('renders a generic message for errors without a message', () => {
    render({ messages: [] });

    expect(
      screen.getByText('An unexpected error occurred'),
    ).toBeInTheDocument();
  });

  it('renders all messages', () => {
    render({ messages: ['One', 'Two', 'Three'] });

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('One');
    expect(items[1]).toHaveTextContent('Two');
    expect(items[2]).toHaveTextContent('Three');
  });

  it('renders object messages', () => {
    const objectMessage = { thisIsNot: 'a string' };
    render({ messages: [objectMessage] });

    expect(screen.getByText(JSON.stringify(objectMessage))).toBeInTheDocument();
  });

  it.each(API_ERRORS_SESSION_EXPIRY)(
    'renders a reload button for session expiry error: %s',
    async (code) => {
      const _window = { location: { reload: jest.fn() } };
      render({
        _window,
        code,
        messages: ['Signature error'],
      });

      // Make sure the Signature error message is replaced with a new message.
      expect(screen.getByText('Your session has expired')).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: 'Reload To Continue' }),
      );

      // The button should reload the location.
      expect(_window.location.reload).toHaveBeenCalled();
    },
  );

  it.each(API_ERRORS_SESSION_EXPIRY)(
    'handles multiple session expiry error: %s',
    (code) => {
      // Make sure this doesn't throw any errors when logging a warning.
      render({
        code,
        messages: ['First signature error', 'Second signature error'],
      });

      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    },
  );
});
