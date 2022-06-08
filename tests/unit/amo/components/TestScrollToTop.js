import * as React from 'react';

import ScrollToTop from 'amo/components/ScrollToTop';
import {
  dispatchClientMetadata,
  onLocationChanged,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({ location, ...props } = {}) => {
    return defaultRender(<ScrollToTop {...props} />, { location, store });
  };

  it('renders nothing if there are no children', () => {
    const { root } = render();

    expect(root).toEqual(null);
  });

  it('renders children', () => {
    const childText = 'Some text to look for';
    render({ children: <div>{childText}</div> });

    expect(screen.getByText(childText)).toBeInTheDocument();
  });

  it('calls window.scrollTo() when location changes', () => {
    const _window = {
      scrollTo: jest.fn(),
    };

    render({ _window, location: '/' });
    expect(_window.scrollTo).not.toHaveBeenCalled();

    store.dispatch(
      onLocationChanged({
        pathname: '/another/path/',
      }),
    );

    expect(_window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  // eslint-disable-next-line jest/expect-expect
  it('does not call window.scrollTo() when window is not defined', () => {
    const _window = null;

    // Make sure this doesn't throw.
    render({ _window });
  });

  it('does not call window.scrollTo() when location does not change', () => {
    const _window = {
      scrollTo: jest.fn(),
    };

    render({ _window, location: '/' });
    expect(_window.scrollTo).not.toHaveBeenCalled();

    store.dispatch(
      onLocationChanged({
        pathname: '/',
      }),
    );

    expect(_window.scrollTo).not.toHaveBeenCalled();
  });
});
