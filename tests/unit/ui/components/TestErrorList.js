import * as React from 'react';

import { API_ERROR_SIGNATURE_EXPIRED } from 'core/constants';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import ErrorList, { ErrorListBase } from 'ui/components/ErrorList';

function render(customProps = {}) {
  const props = {
    i18n: fakeI18n(),
    messages: [],
    _window: { location: { reload: sinon.stub() } },
    ...customProps,
  };
  return shallowUntilTarget(<ErrorList {...props} />, ErrorListBase);
}

describe(__filename, () => {
  it('supports a custom class name', () => {
    const root = render({ className: 'MyClass' });
    expect(root).toHaveClassName('MyClass');
    expect(root).toHaveClassName('ErrorList');
  });

  it('renders a message', () => {
    const root = render({ messages: ['Some error'] });

    const notice = root.find('Notice');
    expect(notice.prop('type')).toEqual('error');
    expect(notice.html()).toContain('Some error');
  });

  it('renders a generic message for errors without a message', () => {
    const root = render({ messages: [] });
    expect(root.find('Notice').html()).toContain(
      'An unexpected error occurred',
    );
  });

  it('renders all messages', () => {
    const root = render({
      messages: ['One', 'Two', 'Three'],
    });
    const items = root.find('Notice');
    expect(items.at(0).html()).toContain('One');
    expect(items.at(1).html()).toContain('Two');
    expect(items.at(2).html()).toContain('Three');
  });

  it('renders object messages', () => {
    const objectMessage = { thisIsNot: 'a string' };
    const root = render({ messages: [objectMessage] });
    expect(
      root
        .find('Notice')
        .childAt(0)
        .text(),
    ).toEqual(JSON.stringify(objectMessage));
  });

  it('renders a reload button for signature expired errors', () => {
    const _window = { location: { reload: sinon.stub() } };
    const root = render({
      _window,
      code: API_ERROR_SIGNATURE_EXPIRED,
      messages: ['Signature error'],
    });

    const notice = root.find('Notice');
    // Make sure the Signature error message is replaced with a new message.
    expect(notice.html()).toContain('Your session has expired');

    expect(notice.prop('actionText')).toEqual('Reload To Continue');
    expect(notice.prop('actionOnClick')).toBeDefined();

    const action = notice.prop('actionOnClick');
    // Simulate how <Notice /> will execute this callback on button press.
    action();

    // The button should reload the location.
    sinon.assert.called(_window.location.reload);
  });

  it('handles multiple signature expired errors', () => {
    // Make sure this doesn't throw any errors when logging a warning.
    const root = render({
      code: API_ERROR_SIGNATURE_EXPIRED,
      messages: ['First signature error', 'Second signature error'],
    });

    expect(root.find('.ErrorList-item')).toHaveLength(2);
  });
});
