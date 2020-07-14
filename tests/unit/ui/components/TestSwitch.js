/* eslint react/no-find-dom-node: 0 */
import * as React from 'react';
import { Simulate, renderIntoDocument } from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';

import Switch from 'ui/components/Switch';

describe(__filename, () => {
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
    expect(checkbox.hasAttribute('disabled')).toEqual(false);
    expect(checkbox.checked).toEqual(false);
  });

  it('is inactive when disabled', () => {
    const button = renderButton({ disabled: true });
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    expect(checkbox.hasAttribute('disabled')).toEqual(true);
    expect(checkbox.checked).toEqual(false);
  });

  it('is active when checked and not disabled', () => {
    const button = renderButton({ checked: true });
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    expect(checkbox.hasAttribute('disabled')).toEqual(false);
    expect(checkbox.checked).toEqual(true);
  });

  it('is inactive when checked and disabled', () => {
    const button = renderButton({ checked: true, disabled: true });
    const root = findDOMNode(button);
    const checkbox = root.querySelector('input[type=checkbox]');
    expect(checkbox.hasAttribute('disabled')).toEqual(true);
    expect(checkbox.checked).toEqual(true);
  });

  it('shows success when success is set', () => {
    const button = renderButton({ success: true });
    const root = findDOMNode(button);
    expect(root.classList.contains('Switch--success')).toBeTruthy();
  });

  it('does not include the progress when it is undefined', () => {
    const button = renderButton();
    const root = findDOMNode(button);
    expect(root.getAttribute('data-progress')).toEqual('0');
  });

  it('reflects valid progress values', () => {
    const button = renderButton({ progress: 50 });
    const root = findDOMNode(button);
    expect(root.classList.contains('Switch--progress')).toBeTruthy();
    expect(root.getAttribute('data-progress')).toEqual('50');
  });

  it('reflects indefinite progress', () => {
    const button = renderButton({ checked: true, progress: Infinity });
    const root = findDOMNode(button);
    expect(root.classList.contains('Switch--indefinite')).toBeTruthy();
    const checkbox = root.querySelector('input[type=checkbox]');
    expect(checkbox.checked).toEqual(true);
    expect(root.getAttribute('data-progress')).toEqual('100');
  });

  it('reflects indefinite reverse progress', () => {
    const button = renderButton({ checked: false, progress: -Infinity });
    const root = findDOMNode(button);
    expect(root.classList.contains('Switch--indefinite-reverse')).toBeTruthy();
    const checkbox = root.querySelector('input[type=checkbox]');
    expect(checkbox.checked).toEqual(false);
    expect(root.getAttribute('data-progress')).toEqual('0');
  });

  it('passes change calls to onChange', () => {
    const onChange = sinon.spy();
    const root = findDOMNode(renderButton({ onChange }));
    const checkbox = root.querySelector('input[type=checkbox]');

    Simulate.change(checkbox);

    sinon.assert.called(onChange);
  });

  it('associates the label and input with id and for attributes', () => {
    const button = renderButton({ name: 'foo' });
    const root = findDOMNode(button);
    expect(root.querySelector('input').getAttribute('id')).toEqual(
      'install-button-foo',
    );
    expect(root.querySelector('label').getAttribute('for')).toEqual(
      'install-button-foo',
    );
  });
});
