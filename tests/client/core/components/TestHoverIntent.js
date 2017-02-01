import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';
import {
  findDOMNode,
} from 'react-dom';

import HoverIntent from 'core/components/HoverIntent';

function renderHoverIntent({ ...props }) {
  const sensitivity = 5;
  const interval = 50;
  const hoverIntent = findRenderedComponentWithType(renderIntoDocument(
    <HoverIntent {...props} sensitivity={sensitivity} interval={interval}>
      <span id="text-content">Text content</span>
    </HoverIntent>
  ), HoverIntent);
  const innerElement = findDOMNode(hoverIntent);

  return { hoverIntent, innerElement };
}

describe('<HoverIntent />', () => {
  let hoverIntent;
  let innerElement;
  let props;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    props = {
      onHoverIntent: sinon.spy(),
      onHoverIntentEnd: sinon.spy(),
    };
    const rendered = renderHoverIntent(props);
    hoverIntent = rendered.hoverIntent;
    innerElement = rendered.innerElement;
  });

  afterEach(() => {
    clock.restore();
  });

  it('runs onHoverIntent if mouse slows/stops on inner element', () => {
    Simulate.mouseOver(innerElement, { clientX: 1, clientY: 2 });

    clock.tick(75);
    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 0 });

    clock.tick(50);
    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 1 });

    clock.tick(50);
    Simulate.mouseOut(innerElement);

    const { onHoverIntent, onHoverIntentEnd } = props;
    assert.ok(onHoverIntent.calledOnce);
    assert.ok(onHoverIntentEnd.calledOnce);
  });

  it("does not run onHoverIntent if mouse doesn't slow on inner element", () => {
    Simulate.mouseOver(innerElement, { clientX: 0, clientY: 0 });

    clock.tick(75);
    Simulate.mouseMove(innerElement, { clientX: 5, clientY: 5 });

    clock.tick(50);
    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 10 });

    clock.tick(50);
    Simulate.mouseOut(innerElement);

    const { onHoverIntent, onHoverIntentEnd } = props;
    assert.isNotOk(onHoverIntent.calledOnce);
    assert.isNotOk(onHoverIntentEnd.calledOnce);
  });

  it("does not run onHoverIntent if mouse doesn't move enough on inner element", () => {
    Simulate.mouseOver(innerElement, { clientX: 0, clientY: 0 });

    clock.tick(75);
    Simulate.mouseMove(innerElement, { clientX: 1, clientY: 0 });

    clock.tick(50);
    Simulate.mouseMove(innerElement, { clientX: 1, clientY: 1 });

    clock.tick(50);
    Simulate.mouseOut(innerElement);

    const { onHoverIntent, onHoverIntentEnd } = props;
    assert.isNotOk(onHoverIntent.calledOnce);
    assert.isNotOk(onHoverIntentEnd.calledOnce);
  });

  it('clears the hover intent interval when component unmounts', () => {
    Simulate.mouseOver(innerElement, { clientX: 0, clientY: 0 });
    hoverIntent.componentWillUnmount();

    clock.tick(75);
    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 0 });

    clock.tick(50);
    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 1 });

    clock.tick(50);
    Simulate.mouseOut(innerElement);

    const { onHoverIntent, onHoverIntentEnd } = props;
    assert.isNotOk(onHoverIntent.calledOnce);
    assert.isNotOk(onHoverIntentEnd.calledOnce);
  });
});
