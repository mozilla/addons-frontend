import React from 'react';
import { findDOMNode } from 'react-dom';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';

import { API_ERROR_SIGNATURE_EXPIRED } from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';

function render(customProps = {}) {
  const props = {
    messages: [],
    _window: { location: { reload: sinon.stub() } },
    ...customProps,
  };
  return findDOMNode(renderIntoDocument(
    <I18nProvider i18n={getFakeI18nInst()}>
      <ErrorList {...props} />
    </I18nProvider>
  ));
}

describe('ui/components/ErrorList', () => {
  it('supports a custom class name', () => {
    const root = render({ className: 'MyClass' });
    expect(root.className).toContain('MyClass');
  });

  it('renders a message', () => {
    const root = render({ messages: ['Some error'] });
    expect(root.textContent).toEqual('Some error');
  });

  it('renders a generic message for errors without a message', () => {
    const root = render({ messages: [] });
    expect(root.textContent).toEqual('An unexpected error occurred');
  });

  it('renders all messages', () => {
    const root = render({
      messages: ['One', 'Two', 'Three'],
    });
    const items = root.querySelectorAll('.ErrorList-item');
    expect(items[0].textContent).toEqual('One');
    expect(items[1].textContent).toEqual('Two');
    expect(items[2].textContent).toEqual('Three');
  });

  it('renders object messages', () => {
    const objectMessage = { thisIsNot: 'a string' };
    const root = render({ messages: [objectMessage] });
    expect(root.textContent).toEqual(JSON.stringify(objectMessage));
  });

  it('renders a reload button for signature expired errors', () => {
    const _window = { location: { reload: sinon.stub() } };
    const root = render({
      _window,
      code: API_ERROR_SIGNATURE_EXPIRED,
      messages: ['Signature error'],
    });

    const message = root.querySelectorAll('.ErrorList-item')[0];
    // A better message should be displayed:
    expect(message.textContent).toEqual('Your session has expired');

    const button = root.querySelector('.ErrorList-item .Button');
    expect(button.textContent).toEqual('Reload To Continue');
    Simulate.click(button);
    expect(_window.location.reload.called).toBeTruthy();
  });
});
