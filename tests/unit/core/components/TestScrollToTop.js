import * as React from 'react';

import ScrollToTop, { ScrollToTopBase } from 'amo/components/ScrollToTop';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ location, ...props } = {}) => {
    return shallowUntilTarget(<ScrollToTop {...props} />, ScrollToTopBase, {
      shallowOptions: createContextWithFakeRouter({ location }),
    });
  };

  it('renders nothing if there are no children', () => {
    const root = render();
    expect(root.html()).toEqual(null);
  });

  it('renders children', () => {
    const root = render({ children: <p /> });
    expect(root.find('p')).toHaveLength(1);
  });

  it('calls window.scrollTo() when location changes', () => {
    const _window = {
      scrollTo: sinon.spy(),
    };

    const root = render({ _window });
    sinon.assert.notCalled(_window.scrollTo);

    root.setProps({ location: createFakeLocation() });
    sinon.assert.calledWith(_window.scrollTo, 0, 0);
  });

  it('does not call window.scrollTo() when window is not defined', () => {
    const _window = null;

    const root = render({ _window });

    // Make sure this doesn't throw.
    root.setProps({ location: createFakeLocation() });
  });

  it('does not call window.scrollTo() when location does not change', () => {
    const _window = {
      scrollTo: sinon.spy(),
    };
    const location = createFakeLocation();

    const root = render({ _window, location });
    sinon.assert.notCalled(_window.scrollTo);

    root.setProps({ location });
    sinon.assert.notCalled(_window.scrollTo);
  });
});
