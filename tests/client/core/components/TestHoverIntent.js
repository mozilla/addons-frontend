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
    const { onHoverIntent, onHoverIntentEnd } = props;

    Simulate.mouseOver(innerElement, { clientX: 1, clientY: 2 });
    clock.tick(75);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 0 });
    clock.tick(50);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 1 });
    clock.tick(50);
    assert.ok(onHoverIntent.calledOnce);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseOut(innerElement);
    assert.ok(onHoverIntentEnd.calledOnce);
  });

  it("does not run onHoverIntent if mouse doesn't slow on inner element", () => {
    const { onHoverIntent, onHoverIntentEnd } = props;

    Simulate.mouseOver(innerElement, { clientX: 0, clientY: 0 });
    clock.tick(75);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseMove(innerElement, { clientX: 5, clientY: 5 });
    clock.tick(50);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 10 });
    clock.tick(50);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseOut(innerElement);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);
  });

  it("does not run onHoverIntent if mouse doesn't move enough on inner element", () => {
    const { onHoverIntent, onHoverIntentEnd } = props;

    Simulate.mouseOver(innerElement, { clientX: 0, clientY: 0 });
    clock.tick(75);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseMove(innerElement, { clientX: 1, clientY: 0 });
    clock.tick(50);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseMove(innerElement, { clientX: 1, clientY: 1 });
    clock.tick(50);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseOut(innerElement);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);
  });

  it('clears the hover intent interval when component unmounts', () => {
    const { onHoverIntent, onHoverIntentEnd } = props;

    Simulate.mouseOver(innerElement, { clientX: 0, clientY: 0 });
    clock.tick(75);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);
    hoverIntent.componentWillUnmount();

    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 0 });
    clock.tick(50);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseMove(innerElement, { clientX: 10, clientY: 1 });
    clock.tick(50);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);

    Simulate.mouseOut(innerElement);
    assert.isNotOk(onHoverIntent.called);
    assert.isNotOk(onHoverIntentEnd.called);
  });

  it('throws if child provides onMouse events', () => {
    assert.throws(() => renderIntoDocument(
      <HoverIntent {...props} sensitivity={5} interval={10}>
        <span onMouseOver={() => {}}>Test</span>
      </HoverIntent>
    ), /onMouseOver/);

    assert.throws(() => renderIntoDocument(
      <HoverIntent {...props} sensitivity={5} interval={10}>
        <span onMouseOut={() => {}}>Test</span>
      </HoverIntent>
    ), /onMouseOut/);

    assert.throws(() => renderIntoDocument(
      <HoverIntent {...props} sensitivity={5} interval={10}>
        <span onMouseMove={() => {}}>Test</span>
      </HoverIntent>
    ), /onMouseMove/);
  });
});
