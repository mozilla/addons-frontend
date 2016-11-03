/* global requestAnimationFrame, window, TransitionEvent */
import React from 'react';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';

import SearchInput from 'ui/components/SearchInput';

describe('<SearchInput />', () => {
  it('sets the icon position on resize', () => {
    const addEventListener = sinon.stub(window, 'addEventListener');
    const removeEventListener = sinon.stub(window, 'removeEventListener');
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assert.ok(addEventListener.calledWith('resize', root.setIconPosition));
    assert.notOk(removeEventListener.called);
    root.componentWillUnmount();
    assert.ok(removeEventListener.calledWith('resize', root.setIconPosition));
  });

  it('starts with the --text class with a defaultValue', () => {
    const root = renderIntoDocument(<SearchInput name="foo" defaultValue="wat" />);
    assert.ok(root.root.classList.contains('SearchInput--text'));
  });

  it('sets the value in state on input', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assert.equal(root.state.value, undefined);
    Simulate.input(root.input, { target: { value: 'test' } });
    assert.equal(root.state.value, 'test');
  });

  it('sets and removes the --text class on focus and blur when empty', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assert.notOk(root.root.classList.contains('SearchInput--text'));
    Simulate.focus(root.input);
    assert.ok(root.root.classList.contains('SearchInput--text'));
    Simulate.blur(root.input);
    assert.notOk(root.root.classList.contains('SearchInput--text'));
  });

  it('keeps the --text class on blur when it has text', () => {
    const root = renderIntoDocument(<SearchInput name="foo" defaultValue="Hello" />);
    assert.ok(root.root.classList.contains('SearchInput--text'));
    Simulate.blur(root.input);
    assert.ok(root.root.classList.contains('SearchInput--text'));
  });

  it('adds the --test class on mousedown', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assert.notOk(root.root.classList.contains('SearchInput--text'));
    Simulate.mouseDown(root.input);
    assert.ok(root.root.classList.contains('SearchInput--text'));
  });

  it('delays the input focus on mousedown without text', () => (
    new Promise((resolve) => {
      const root = renderIntoDocument(<SearchInput name="foo" />);
      const event = { preventDefault: sinon.spy() };
      sinon.spy(root.input, 'focus');

      Simulate.mouseDown(root.input, event);
      assert.ok(event.preventDefault.called);
      assert.notOk(root.input.focus.called);
      root.animateIcon.dispatchEvent(new TransitionEvent('transitionend'));
      requestAnimationFrame(() => {
        assert.ok(root.input.focus.called);
        resolve();
      });
    })
  ));

  it('does not delay the input focus on mousedown with text', () => (
    new Promise((resolve) => {
      const root = renderIntoDocument(<SearchInput name="foo" defaultValue="yo" />);
      const event = { preventDefault: sinon.spy() };

      Simulate.mouseDown(root.input, event);
      assert.notOk(event.preventDefault.called);
      resolve();
    })
  ));

  it('exposes the value of the input', () => {
    const root = renderIntoDocument(<SearchInput name="foo" defaultValue="yo" />);
    assert.equal(root.value, 'yo');
  });
});
