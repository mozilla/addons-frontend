import * as React from 'react';
import { renderIntoDocument, Simulate } from 'react-dom/test-utils';

import Overlay from 'ui/components/Overlay';

describe(__filename, () => {
  function render(props = {}) {
    return renderIntoDocument(<Overlay {...props} />);
  }

  it('renders an Overlay', () => {
    const root = render();
    expect(root.overlayContainer).toBeTruthy();
    expect(root.overlayBackground).toBeTruthy();
    expect(root.overlayContainer.tagName).toEqual('DIV');
    expect(root.overlayContainer.className).toContain('Overlay');
  });

  it('renders extra className if provided', () => {
    const root = render({ className: 'I-am-so-over-it' });
    expect(root.overlayContainer.className).toContain('Overlay');
    expect(root.overlayContainer.className).toContain('I-am-so-over-it');
  });

  it('renders children', () => {
    const root = render({ children: 'hello' });
    expect(root.overlayContents).toBeTruthy();
    expect(root.overlayContents.textContent).toContain('hello');
  });

  it('is hidden by default', () => {
    const root = render();
    expect(root.overlayContainer.className).not.toContain('Overlay--visible');
  });

  it('is visible when the `visibleOnLoad` prop is passed', () => {
    const root = render({ visibleOnLoad: true });
    expect(root.overlayContainer.className).toContain('Overlay--visible');
  });

  it('hides when you click the background', () => {
    const root = render({ visibleOnLoad: true });
    Simulate.click(root.overlayBackground);
    expect(root.overlayContainer.className).not.toContain('Overlay--visible');
  });

  it('calls onEscapeOverlay when clicking the background', () => {
    const onEscapeOverlay = sinon.stub();
    const root = render({ visibleOnLoad: true, onEscapeOverlay });
    Simulate.click(root.overlayBackground);
    sinon.assert.called(onEscapeOverlay);
  });

  it('is shown and hidden when `hide()` and `show()` are called', () => {
    const root = render();

    root.show();
    expect(root.overlayContainer.className).toContain('Overlay--visible');

    root.hide();
    expect(root.overlayContainer.className).not.toContain('Overlay--visible');
  });

  it('is toggled', () => {
    const root = render();

    root.toggle();
    expect(root.overlayContainer.className).toContain('Overlay--visible');

    root.toggle();
    expect(root.overlayContainer.className).not.toContain('Overlay--visible');
  });
});
