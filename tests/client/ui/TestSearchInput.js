/* global requestAnimationFrame, window, TransitionEvent */
import React from 'react';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';

import SearchInput from 'ui/components/SearchInput';

describe('<SearchInput />', () => {
  it('uses the initial value for the left offset', () => {
    // Test elements don't actually get rendered so all of the offsets are 0.
    const root = renderIntoDocument(<SearchInput name="foo" />);
    root.animateLeft = 100;
    root.setIconPosition();
    assert.equal(root.animateIcon.style.transform, 'translateX(-100px)');
  });

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

  it('sets the --animating class on blur without a value', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assert.notOk(root.root.classList.contains('SearchInput--animating'));
    Simulate.blur(root.input);
    assert.ok(root.root.classList.contains('SearchInput--animating'));
  });

  it('does not set the --animating class on blur with a value', () => {
    const root = renderIntoDocument(<SearchInput name="foo" value="yo" />);
    assert.notOk(root.root.classList.contains('SearchInput--animating'));
    Simulate.blur(root.input);
    assert.notOk(root.root.classList.contains('SearchInput--animating'));
  });

  it('adds the --text and --animating classes on focus without a value', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assert.notOk(root.root.classList.contains('SearchInput--text'));
    assert.notOk(root.root.classList.contains('SearchInput--animating'));
    Simulate.focus(root.input);
    assert.ok(root.root.classList.contains('SearchInput--text'));
    assert.ok(root.root.classList.contains('SearchInput--animating'));
  });

  it('only adds the --text class on focus with a value', () => {
    const root = renderIntoDocument(<SearchInput name="foo" value="hey" />);
    assert.notOk(root.root.classList.contains('SearchInput--text'));
    assert.notOk(root.root.classList.contains('SearchInput--animating'));
    Simulate.focus(root.input);
    assert.ok(root.root.classList.contains('SearchInput--text'));
    assert.notOk(root.root.classList.contains('SearchInput--animating'));
  });

  it('clears the --animating class on transitionend', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    root.setState({ animating: true });
    assert.ok(root.root.classList.contains('SearchInput--animating'));
    Simulate.transitionEnd(root.animateIcon);
    assert.notOk(root.root.classList.contains('SearchInput--animating'));
  });

  it('exposes the value of the input', () => {
    const root = renderIntoDocument(<SearchInput name="foo" defaultValue="yo" />);
    assert.equal(root.value, 'yo');
  });
});
