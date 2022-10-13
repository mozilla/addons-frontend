import * as React from 'react';

import ScrollToTop from 'amo/components/ScrollToTop';
import { changeLocation, dispatchClientMetadata, render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  let history;
  let store;
  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({
    location,
    ...props
  } = {}) => {
    const renderResults = defaultRender(<ScrollToTop {...props} />, {
      initialEntries: [location || '/'],
      store,
    });
    history = renderResults.history;
    return renderResults;
  };

  it('renders nothing if there are no children', () => {
    const {
      root,
    } = render();
    expect(root).toEqual(null);
  });
  it('renders children', () => {
    const childText = 'Some text to look for';
    render({
      children: <div>{childText}</div>,
    });
    expect(screen.getByText(childText)).toBeInTheDocument();
  });
  it('calls window.scrollTo() when location changes', async () => {
    const _window = {
      scrollTo: jest.fn(),
    };
    render({
      _window,
      location: '/',
    });
    expect(_window.scrollTo).not.toHaveBeenCalled();
    await changeLocation({
      history,
      pathname: '/another/path/',
    });
    expect(_window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
  it('calls window.scrollTo() when location query string is added', async () => {
    const _window = {
      scrollTo: jest.fn(),
    };
    render({
      _window,
      location: '/some/path/',
    });
    expect(_window.scrollTo).not.toHaveBeenCalled();
    await changeLocation({
      history,
      pathname: '/some/path/?withquerystring=2',
    });
    expect(_window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
  it('calls window.scrollTo() when location query string changes', async () => {
    const _window = {
      scrollTo: jest.fn(),
    };
    render({
      _window,
      location: '/some/path/?withquerystring=1',
    });
    expect(_window.scrollTo).not.toHaveBeenCalled();
    await changeLocation({
      history,
      pathname: '/some/path/?withquerystring=2',
    });
    expect(_window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
  // eslint-disable-next-line jest/expect-expect
  it('does not call window.scrollTo() when window is not defined', () => {
    const _window = null;
    // Make sure this doesn't throw.
    render({
      _window,
    });
  });
  it('does not call window.scrollTo() when location does not change', async () => {
    const _window = {
      scrollTo: jest.fn(),
    };
    render({
      _window,
      location: '/',
    });
    expect(_window.scrollTo).not.toHaveBeenCalled();
    await changeLocation({
      history,
      pathname: '/',
    });
    expect(_window.scrollTo).not.toHaveBeenCalled();
  });
});