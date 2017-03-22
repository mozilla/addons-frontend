/* global requestAnimationFrame, window, TransitionEvent */
import React from 'react';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';

import { assertHasClass, assertNotHasClass } from 'tests/client/helpers';
import SearchInput from 'ui/components/SearchInput';

describe('<SearchInput />', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

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
    assertHasClass(root.root, 'SearchInput--text');
  });

  it('sets the value in state on input', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assert.equal(root.state.value, undefined);
    Simulate.input(root.input, { target: { value: 'test' } });
    assert.equal(root.state.value, 'test');
  });

  it('sets and removes the --text class on focus and blur when empty', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assertNotHasClass(root.root, 'SearchInput--text');
    Simulate.focus(root.input);
    assertHasClass(root.root, 'SearchInput--text');
    Simulate.blur(root.input);
    assertNotHasClass(root.root, 'SearchInput--text');
  });

  it('keeps the --text class on blur when it has text', () => {
    const root = renderIntoDocument(<SearchInput name="foo" defaultValue="Hello" />);
    assertHasClass(root.root, 'SearchInput--text');
    Simulate.blur(root.input);
    assertHasClass(root.root, 'SearchInput--text');
  });

  it('sets the --animating class on blur without a value', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assertNotHasClass(root.root, 'SearchInput--animating');
    Simulate.blur(root.input);
    assertHasClass(root.root, 'SearchInput--animating');
  });

  it('does not set the --animating class on blur with a value', () => {
    const root = renderIntoDocument(<SearchInput name="foo" value="yo" />);
    assertNotHasClass(root.root, 'SearchInput--animating');
    Simulate.blur(root.input);
    assertNotHasClass(root.root, 'SearchInput--animating');
  });

  it('adds the --text and --animating classes on focus without a value', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    assertNotHasClass(root.root, 'SearchInput--text');
    assertNotHasClass(root.root, 'SearchInput--animating');
    Simulate.focus(root.input);
    assertHasClass(root.root, 'SearchInput--text');
    assertHasClass(root.root, 'SearchInput--animating');
  });

  it('only adds the --text class on focus with a value', () => {
    const root = renderIntoDocument(<SearchInput name="foo" value="hey" />);
    assertNotHasClass(root.root, 'SearchInput--text');
    assertNotHasClass(root.root, 'SearchInput--animating');
    Simulate.focus(root.input);
    assertHasClass(root.root, 'SearchInput--text');
    assertNotHasClass(root.root, 'SearchInput--animating');
  });

  it('clears the --animating class on transitionend', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    root.setState({ animating: true });
    assertHasClass(root.root, 'SearchInput--animating');
    Simulate.transitionEnd(root.animateIcon);
    assertNotHasClass(root.root, 'SearchInput--animating');
  });

  it('clears the --animating class when timeout fires', () => {
    const root = renderIntoDocument(<SearchInput name="foo" />);
    root.setState({ animating: true });
    assertHasClass(root.root, 'SearchInput--animating');
    Simulate.focus(root.input);
    clock.tick(300);
    assertNotHasClass(root.root, 'SearchInput--animating');
  });

  it('exposes the value of the input', () => {
    const root = renderIntoDocument(<SearchInput name="foo" defaultValue="yo" />);
    assert.equal(root.value, 'yo');
  });
});
