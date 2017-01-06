import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import OverlayCard from 'ui/components/OverlayCard';


describe('<OverlayCard />', () => {
  function render(props = {}) {
    return renderIntoDocument(<OverlayCard {...props} />);
  }

  it('renders an OverlayCard', () => {
    const root = render();
    assert(root.overlayCard);
  });

  it('passes the header', () => {
    const root = render({ header: 'header' });
    const rootNode = findDOMNode(root);

    assert.include(
      rootNode.querySelector('.Card-header').textContent, 'header');
  });

  it('passes the footer', () => {
    const root = render({ footer: 'footer' });
    const rootNode = findDOMNode(root);

    assert.include(
      rootNode.querySelector('.Card-footer').textContent, 'footer');
  });

  it('passes children', () => {
    const root = render({ children: <div className="kids">hi</div> });
    const rootNode = findDOMNode(root);

    assert.include(
      rootNode.querySelector('.kids').textContent, 'hi');
  });

  it('is hidden by default', () => {
    const root = render();
    assert.notInclude(
      root.overlay.overlayContainer.className, 'Overlay--visible');
  });

  it('is visible when the `visibleOnLoad` prop is passed', () => {
    const root = render({ visibleOnLoad: true });
    assert.include(root.overlay.overlayContainer.className, 'Overlay--visible');
  });

  it('is shown and hidden when `hide()` and `show()` are called', () => {
    const root = render();

    root.show();
    assert.include(root.overlay.overlayContainer.className, 'Overlay--visible');

    root.hide();
    assert.notInclude(
      root.overlay.overlayContainer.className, 'Overlay--visible');
  });

  it('is toggled', () => {
    const root = render();

    root.toggle();
    assert.include(root.overlay.overlayContainer.className, 'Overlay--visible');

    root.toggle();
    assert.notInclude(
      root.overlay.overlayContainer.className, 'Overlay--visible');
  });
});
