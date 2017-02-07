import React from 'react';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';

import Overlay from 'ui/components/Overlay';


describe('<Overlay />', () => {
  function render(props = {}) {
    return renderIntoDocument(<Overlay {...props} />);
  }

  it('renders an Overlay', () => {
    const root = render();
    assert(root.overlayContainer);
    assert(root.overlayBackground);
    assert.equal(root.overlayContainer.tagName, 'DIV');
    assert.include(root.overlayContainer.className, 'Overlay');
  });

  it('renders extra className if provided', () => {
    const root = render({ className: 'I-am-so-over-it' });
    assert.include(root.overlayContainer.className, 'Overlay');
    assert.include(root.overlayContainer.className, 'I-am-so-over-it');
  });

  it('renders children', () => {
    const root = render({ children: 'hello' });
    assert(root.overlayContents);
    assert.include(root.overlayContents.textContent, 'hello');
  });

  it('is hidden by default', () => {
    const root = render();
    assert.notInclude(root.overlayContainer.className, 'Overlay--visible');
  });

  it('is visible when the `visibleOnLoad` prop is passed', () => {
    const root = render({ visibleOnLoad: true });
    assert.include(root.overlayContainer.className, 'Overlay--visible');
  });

  it('hides when you click the background', () => {
    const root = render({ visibleOnLoad: true });
    Simulate.click(root.overlayBackground);
    assert.notInclude(root.overlayContainer.className, 'Overlay--visible');
  });

  it('is shown and hidden when `hide()` and `show()` are called', () => {
    const root = render();

    root.show();
    assert.include(root.overlayContainer.className, 'Overlay--visible');

    root.hide();
    assert.notInclude(root.overlayContainer.className, 'Overlay--visible');
  });

  it('is toggled', () => {
    const root = render();

    root.toggle();
    assert.include(root.overlayContainer.className, 'Overlay--visible');

    root.toggle();
    assert.notInclude(root.overlayContainer.className, 'Overlay--visible');
  });
});
