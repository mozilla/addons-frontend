import * as React from 'react';

import {
  applyUIStateChanges,
  createFakeEvent,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
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
    return shallowUntilTarget(
      <Overlay {...getProps(otherProps)}>{children}</Overlay>,
      OverlayBase,
    );
  };

  it('renders an Overlay', () => {
    const root = render();
    expect(root).toHaveClassName('Overlay');
    expect(root.find('.Overlay')).toHaveLength(1);
    expect(root.find('.Overlay-background')).toHaveLength(1);
    expect(root.find('.Overlay-contents')).toHaveLength(1);
  });

  it('renders extra className if provided', () => {
    const className = 'I-am-so-over-it';
    const root = render({ className });
    expect(root.find(`.${className}`)).toHaveLength(1);
  });

  it('renders children', () => {
    const html = '<div>a child div</div>';
    const root = render({ children: html });
    expect(root.html()).toContain('a child div');
  });

  it('is hidden by default', () => {
    const root = render();
    expect(root.instance().props.uiState.visible).toEqual(false);
  });

  it('is visible when the `visibleOnLoad` prop is passed', () => {
    const { store } = dispatchClientMetadata();

    const root = render({
      store,
      visibleOnLoad: true,
      uiState: { visible: false },
    });

    expect(root.instance().props.uiState.visible).toEqual(false);

    applyUIStateChanges({ root, store });

    // Applying this 2 times here to mimic componentWillReceiveProps
    // in that it see the uiState changes till the 2nd run through
    applyUIStateChanges({ root, store });

    expect(root.instance().props.uiState.visible).toEqual(true);
  });

  it('hides when you click the background', () => {
    const onClickBackground = sinon.stub();
    const root = render({ visibleOnLoad: true, onClickBackground });
    const btn = root.find('.Overlay-background');
    btn.simulate('click', createFakeEvent());
    sinon.assert.called(onClickBackground);
  });

  it('calls onEscapeOverlay when clicking the background', () => {
    const onEscapeOverlay = sinon.stub();
    const root = render({
      visibleOnLoad: true,
      onEscapeOverlay,
    });
    const btn = root.find('.Overlay-background');
    btn.simulate('click', createFakeEvent());
    root.instance().onClickBackground();
    sinon.assert.called(onEscapeOverlay);
  });

  it('is shown and hidden when `hide()` and `show()` are called', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    root.instance().show();
    applyUIStateChanges({ root, store });
    expect(root).toHaveClassName('Overlay--visible');

    root.instance().hide();
    applyUIStateChanges({ root, store });
    expect(root).not.toHaveClassName('Overlay--visible');
  });

  it('is toggled', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    root.instance().toggle();
    applyUIStateChanges({ root, store });
    expect(root).toHaveClassName('Overlay--visible');

    root.instance().toggle();
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
