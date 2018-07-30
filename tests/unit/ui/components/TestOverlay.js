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
      visibleOnLoad: false,
    });

    expect(root).not.toHaveClassName('Overlay--visible');

    const newProps = {
      visibleOnLoad: true,
    };

    root.setProps(newProps);

    applyUIStateChanges({ root, store });

    expect(root).toHaveClassName('Overlay--visible');
  });

  it('hides when you click the background', () => {
    const root = render({
      visibleOnLoad: true,
    });
    const btn = root.find('.Overlay-background');
    btn.simulate('click', createFakeEvent());
    expect(root).not.toHaveClassName('Overlay--visible');
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

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'custom-overlay';
      expect(extractId(getProps({ id }))).toEqual(id);
    });
  });
});
