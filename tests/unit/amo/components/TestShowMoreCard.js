import * as React from 'react';
import userEvent from '@testing-library/user-event';

import ShowMoreCard, {
  DEFAULT_MAX_HEIGHT,
  extractId,
} from 'amo/components/ShowMoreCard';
import { setUIState } from 'amo/reducers/uiState';
import {
  createHistory,
  dispatchClientMetadata,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({
    children = 'some text',
    contentId = '123',
    id = 'showMoreCard',
    location,
    ...props
  } = {}) => {
    const renderOptions = {
      history: createHistory({
        initialEntries: [location || '/'],
      }),
      store,
    };

    return defaultRender(
      <ShowMoreCard contentId={contentId} id={id} {...props}>
        {children}
      </ShowMoreCard>,
      renderOptions,
    );
  };

  const mockClientHeight = (height) =>
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: height,
    });

  it('reveals more text when clicking "read more" link', () => {
    // Mock the clientHeight to the "read more" link will be present.
    mockClientHeight(DEFAULT_MAX_HEIGHT + 1);
    render();

    userEvent.click(screen.getByRole('link', { name: 'Expand to read more' }));

    expect(
      screen.queryByRole('link', { name: 'Expand to read more' }),
    ).not.toBeInTheDocument();
    expect(screen.getByClassName('ShowMoreCard')).toHaveClass(
      'ShowMoreCard--expanded',
    );
  });

  it('is expanded by default if content is not too long', () => {
    mockClientHeight(DEFAULT_MAX_HEIGHT - 1);
    render();

    expect(screen.getByClassName('ShowMoreCard')).toHaveClass(
      'ShowMoreCard--expanded',
    );
  });

  it('does not dispatch any setUIState if the content height is smaller than the maxHeight prop', () => {
    const _setUIState = jest.fn();
    mockClientHeight(DEFAULT_MAX_HEIGHT - 1);
    render({ _setUIState });

    expect(_setUIState).not.toHaveBeenCalled();
  });

  it('allows the maxHeight to be configured', () => {
    mockClientHeight(10);
    render({ maxHeight: 11 });

    expect(screen.getByClassName('ShowMoreCard')).toHaveClass(
      'ShowMoreCard--expanded',
    );
  });

  it('renders className', () => {
    const className = 'test';
    render({ className });

    expect(screen.getByClassName('ShowMoreCard')).toHaveClass(className);
  });

  it('renders children', () => {
    const children = 'Hello I am description';
    render({ children });

    expect(screen.getByText(children)).toBeInTheDocument();
  });

  // These two tests need to be executed in the context of a parent, as there
  // is no way for us to directly change the contentId prop of a loaded
  // instance.
  // See https://github.com/mozilla/addons-frontend/issues/11409
  // eslint-disable-next-line jest/no-commented-out-tests
  /*
  it('calls resetUIState if the contentId has changed', () => {
    render({ contentId: 1 });

    const resetUIStateSpy = sinon.spy(root.instance(), 'resetUIState');

    root.setProps({ contentId: 2 });

    sinon.assert.called(resetUIStateSpy);
  });

  it('does not call resetUIState if the contentId is the same', () => {
    render({ contentId: 1 });

    const resetUIStateSpy = sinon.spy(root.instance(), 'resetUIState');

    root.setProps({ contentId: 1 });

    sinon.assert.notCalled(resetUIStateSpy);
  });
  */

  it('executes truncateToMaxHeight when it receives props changes', () => {
    const _truncateToMaxHeight = jest.fn();
    const id = 'id-for-card';
    render({ _truncateToMaxHeight, id });

    const contentsElement = screen.getByClassName('ShowMoreCard-contents');

    // truncateToMaxHeight should have been called on mount.
    expect(_truncateToMaxHeight).toHaveBeenCalledTimes(1);
    expect(_truncateToMaxHeight).toHaveBeenCalledWith(
      expect.objectContaining({ contents: contentsElement }),
    );

    // Manually updating the UIState will cause componentDidUpdate to fire.
    // Because we have mocked _truncateToMaxHeight, the UIState will not have
    // been updated by the component. Here we set readMoreExpanded to false to
    // simulate a case where the content has not been expanded.
    store.dispatch(
      setUIState({
        id: `src/amo/components/ShowMoreCard/index.js-${id}`,
        change: { readMoreExpanded: false },
      }),
    );

    expect(_truncateToMaxHeight).toHaveBeenCalledTimes(2);
  });

  it('does not execute truncateToMaxHeight when "read more" has been expanded', () => {
    const _truncateToMaxHeight = jest.fn();
    const id = 'id-for-card';
    render({ _truncateToMaxHeight, id });

    // truncateToMaxHeight should have been called on mount.
    expect(_truncateToMaxHeight).toHaveBeenCalledTimes(1);
    _truncateToMaxHeight.mockClear();

    // Manually updating the UIState will cause componentDidUpdate to fire.
    // Because we have mocked _truncateToMaxHeight, the UIState will not have
    // been updated by the component. Here we set readMoreExpanded to true to
    // simulate a case where the content has been expanded.
    store.dispatch(
      setUIState({
        id: `src/amo/components/ShowMoreCard/index.js-${id}`,
        change: { readMoreExpanded: true },
      }),
    );

    expect(_truncateToMaxHeight).not.toHaveBeenCalled();
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'custom-card-id';
      expect(extractId({ id })).toEqual(id);
    });
  });
});
