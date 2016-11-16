import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import Switch from 'ui/components/Switch';


describe('<Switch />', () => {
  function renderButton(props = {}) {
    const renderProps = {
      dispatch: sinon.spy(),
      label: 'Hey',
      name: 'sup',
      ...props,
    };

    return renderIntoDocument(<Switch {...renderProps} />);
  }

  it('is off when not checked or disabled', () => {
    const button = renderButton();
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), false);
    assert.equal(checkbox.checked, false);
  });

  it('is inactive when disabled', () => {
    const button = renderButton({ disabled: true });
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), true);
    assert.equal(checkbox.checked, false);
  });

  it('is active when checked and not disabled', () => {
    const button = renderButton({ checked: true });
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), false);
    assert.equal(checkbox.checked, true);
  });

  it('is inactive when checked and disabled', () => {
    const button = renderButton({ checked: true, disabled: true });
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.hasAttribute('disabled'), true);
    assert.equal(checkbox.checked, true);
  });

  it('shows success when success is set', () => {
    const button = renderButton({ success: true });
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('Switch--success'));
  });

  it('does not include the progress when it is undefined', () => {
    const button = renderButton();
    const root = findDOMNode(button);
    assert.equal(root.getAttribute('data-progress'), 0);
  });

  it('reflects valid progress values', () => {
    const button = renderButton({ progress: 50 });
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('Switch--progress'));
    assert.equal(root.getAttribute('data-progress'), 50);
  });

  it('reflects indefinite progress', () => {
    const button = renderButton({ checked: true, progress: Infinity });
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('Switch--indefinite'));
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.checked, true, 'checked is true');
    assert.equal(root.getAttribute('data-progress'), 100);
  });

  it('reflects indefinite reverse progress', () => {
    const button = renderButton({ checked: false, progress: -Infinity });
    const root = findDOMNode(button);
    assert.ok(root.classList.contains('Switch--indefinite-reverse'));
    const checkbox = root.querySelector('input[type=checkbox]');
    assert.equal(checkbox.checked, false, 'checked is false');
    assert.equal(root.getAttribute('data-progress'), 0);
  });

  it('passes change calls to onChange', () => {
    const onChange = sinon.spy();
    const root = findDOMNode(renderButton({ onChange }));
    const checkbox = root.querySelector('input[type=checkbox]');
    Simulate.change(checkbox);
    assert.ok(onChange.calledWith());
  });

  it('associates the label and input with id and for attributes', () => {
    const button = renderButton({ name: 'foo' });
    const root = findDOMNode(button);
    assert.equal(root.querySelector('input').getAttribute('id'),
                'install-button-foo',
                'id is set');
    assert.equal(root.querySelector('label').getAttribute('for'),
                'install-button-foo',
                'for attribute matches id');
  });
});
