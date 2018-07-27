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
    const html = '<div>a child div</div>';
    return shallowUntilTarget(
      <Overlay {...getProps(otherProps)}>{children || html}</Overlay>,
      OverlayBase,
    );
  };

  it('renders an Overlay', () => {
    const root = render();
    expect(root).toHaveClassName('Overlay');
    expect(root.find('.Overlay-background')).toHaveLength(1);
    expect(root.find('.Overlay-contents')).toHaveLength(1);
  });

  it('renders extra className if provided', () => {
    const className = 'I-am-so-over-it';
    const root = render({ className });
    expect(root).toHaveClassName(className);
  });

  it('renders children', () => {
    const html = '<div>overriding child div</div>';
    const root = render({ children: html });
    expect(
      root
        .children()
        .at(1)
        .props().children,
    ).toEqual(html);
  });

  it('is hidden by default', () => {
    const root = render();
    expect(root).not.toHaveClassName('Overlay--visible');
  });

  it('is visible when the `visibleOnLoad` prop is passed', () => {
    const { store } = dispatchClientMetadata();

    const root = render({
      store,
      visibleOnLoad: true,
      uiState: { visible: false },
    });

    expect(root).not.toHaveClassName('Overlay--visible');

    applyUIStateChanges({ root, store });

    // Applying this 2 times here to mimic how uiState works in componentWillReceiveProps:
    // The first time through, the visible state gets changed but these changes
    // aren't shown in uiState till the 2 time through
    applyUIStateChanges({ root, store });

    expect(root).toHaveClassName('Overlay--visible');
  });

  it('hides when you click the background', () => {
    const onClickBackgroundSpy = sinon.stub();
    const root = render({
      visibleOnLoad: true,
      _onClickBackground: onClickBackgroundSpy,
    });
    const btn = root.find('.Overlay-background');
    btn.simulate('click', createFakeEvent());
    sinon.assert.called(onClickBackgroundSpy);
    expect(root).not.toHaveClassName('Overlay--visible');
  });

  it('calls onEscapeOverlay when clicking the background', () => {
    const clickEvent = createFakeEvent();
    const onEscapeOverlay = sinon.stub();
    const root = render({
      visibleOnLoad: true,
      onEscapeOverlay,
    });
    const btn = root.find('.Overlay-background');
    btn.simulate('click', clickEvent);
    const rootInstance = root.instance();
    rootInstance.props._onClickBackground(clickEvent, rootInstance);
    sinon.assert.called(onEscapeOverlay);
  });

  it('is shown and hidden when `hide()` and `show()` are called', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    expect(root).not.toHaveClassName('Overlay--visible');

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

    expect(root).not.toHaveClassName('Overlay--visible');

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
