import * as React from 'react';
import {
  findRenderedComponentWithType, renderIntoDocument,
} from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';

import Overlay from 'ui/components/Overlay';
import OverlayCard from 'ui/components/OverlayCard';


describe('<OverlayCard />', () => {
  function render(props = {}) {
    return renderIntoDocument(<OverlayCard {...props} />);
  }

  it('renders an OverlayCard', () => {
    const root = render();
    expect(root.overlayCard).toBeTruthy();
  });

  it('passes onEscapeOverlay to Overlay', () => {
    const onEscapeOverlay = sinon.stub();
    const root = render({ onEscapeOverlay });
    const overlay = findRenderedComponentWithType(root, Overlay);
    expect(overlay.props.onEscapeOverlay).toEqual(onEscapeOverlay);
  });

  it('passes the header', () => {
    const root = render({ header: 'header' });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('.Card-header').textContent).toContain('header');
  });

  it('passes a footer link', () => {
    const root = render({ footerLink: <a href="/somewhere">link</a> });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('.Card-footer-link').textContent).toContain('link');
  });

  it('passes footer text', () => {
    const root = render({ footerText: 'footer text' });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('.Card-footer-text').textContent).toContain('footer text');
  });

  it('passes children', () => {
    const root = render({ children: <div className="kids">hi</div> });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('.kids').textContent).toContain('hi');
  });

  it('is hidden by default', () => {
    const root = render();
    expect(root.overlay.overlayContainer.className).not.toContain('Overlay--visible');
  });

  it('is visible when the `visibleOnLoad` prop is passed', () => {
    const root = render({ visibleOnLoad: true });
    expect(root.overlay.overlayContainer.className).toContain('Overlay--visible');
  });

  it('is shown and hidden when `hide()` and `show()` are called', () => {
    const root = render();

    root.show();
    expect(root.overlay.overlayContainer.className).toContain('Overlay--visible');

    root.hide();
    expect(root.overlay.overlayContainer.className).not.toContain('Overlay--visible');
  });

  it('is toggled', () => {
    const root = render();

    root.toggle();
    expect(root.overlay.overlayContainer.className).toContain('Overlay--visible');

    root.toggle();
    expect(root.overlay.overlayContainer.className).not.toContain('Overlay--visible');
  });
});
