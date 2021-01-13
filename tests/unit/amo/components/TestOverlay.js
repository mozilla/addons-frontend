import * as React from 'react';

import {
  applyUIStateChanges,
  createFakeEvent,
  dispatchClientMetadata,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Overlay, { OverlayBase, extractId } from 'ui/components/Overlay';

describe(__filename, () => {
  const getProps = ({ ...props } = {}) => {
    return {
      id: 'Overlay',
      className: 'Overlay',
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  const render = ({ children, ...otherProps } = {}) => {
    const html = <div>a child div</div>;
    const props = getProps(otherProps);
    const root = shallowUntilTarget(
      <Overlay {...props}>{children || html}</Overlay>,
      OverlayBase,
    );

    // Apply initial UI state.
    applyUIStateChanges({ root, store: props.store });
    return root;
  };

  it('is hidden by default', () => {
    const root = render();
    expect(root).not.toHaveClassName('Overlay--visible');
  });

  it('becomes visible when its mounted with visibleOnLoad prop as true', () => {
    const root = render({ visibleOnLoad: true });

    expect(root).toHaveClassName('Overlay');
    expect(root).toHaveClassName('Overlay--visible');
    expect(root.find('.Overlay-background')).toHaveLength(1);
    expect(root.find('.Overlay-contents')).toHaveLength(1);
  });

  it('becomes visible once the visibleOnLoad prop of true is passed', () => {
    const { store } = dispatchClientMetadata();

    const root = render({ store });

    expect(root).not.toHaveClassName('Overlay--visible');

    root.setProps({ visibleOnLoad: true });

    applyUIStateChanges({ root, store });

    expect(root).toHaveClassName('Overlay--visible');
  });

  it('renders extra className if provided', () => {
    const className = 'I-am-so-over-it';
    const root = render({ visibleOnLoad: true, className });
    expect(root).toHaveClassName(className);
  });

  it('renders children', () => {
    const text = 'overriding div text..';
    const root = render({ visibleOnLoad: true, children: text });
    expect(root.find('.Overlay-contents')).toHaveText(text);
  });

  it('calls onEscapeOverlay when clicking the background', () => {
    const onEscapeOverlay = sinon.stub();
    const root = render({
      visibleOnLoad: true,
      onEscapeOverlay,
    });
    const btn = root.find('.Overlay-background');
    btn.simulate('click', createFakeEvent());
    sinon.assert.called(onEscapeOverlay);
  });

  it('hides when you click the background', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ visibleOnLoad: true, store });
    const btn = root.find('.Overlay-background');
    btn.simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });
    expect(root).not.toHaveClassName('Overlay--visible');
  });

  it('hides when the "Esc" key is pressed', () => {
    const { store } = dispatchClientMetadata();

    const root = render({ visibleOnLoad: true, store });

    // This will trigger the componentDidUpdate() method.
    // keydown.event will be set when "Esc" is hit.
    root.setProps({
      keydown: {
        event: createFakeEvent(),
      },
    });

    applyUIStateChanges({ root, store });

    expect(root).not.toHaveClassName('Overlay--visible');
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'custom-overlay';
      expect(extractId(getProps({ id }))).toEqual(id);
    });
  });
});
