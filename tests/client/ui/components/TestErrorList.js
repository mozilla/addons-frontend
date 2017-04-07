import React from 'react';
import { findDOMNode } from 'react-dom';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';

import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';
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
    assert.include(root.className, 'MyClass');
  });

  it('renders a message', () => {
    const root = render({ messages: ['Some error'] });
    assert.equal(root.textContent, 'Some error');
  });

  it('renders all messages', () => {
    const root = render({
      messages: ['One', 'Two', 'Three'],
    });
    const items = root.querySelectorAll('.ErrorList-item');
    assert.equal(items[0].textContent, 'One');
    assert.equal(items[1].textContent, 'Two');
    assert.equal(items[2].textContent, 'Three');
  });

  it('renders object messages', () => {
    const objectMessage = { thisIsNot: 'a string' };
    const root = render({ messages: [objectMessage] });
    assert.equal(root.textContent, JSON.stringify(objectMessage));
  });

  it('renders a reload button', () => {
    const _window = { location: { reload: sinon.stub() } };
    const root = render({
      _window,
      messages: ['Some error'],
      needsPageRefresh: true,
    });
    const button = root.querySelector('.ErrorList-item .Button');
    assert.equal(button.textContent, 'Reload To Continue');
    Simulate.click(button);
    assert.ok(
      _window.location.reload.called,
      'window.location.reload() not called');
  });
});
