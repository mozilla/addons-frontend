import * as React from 'react';

import CollectionAddAddon from 'amo/components/CollectionAddAddon';
import { addonAddedToCollection } from 'amo/reducers/collections';
import {
  dispatchClientMetadata,
  render as defaultRender,
} from 'tests/unit/helpers';

// Most of the tests in here have been moved into TestCollection.js as
// integration tests, but these two for `clearTimeout` don't seem to work
// in that context, so they remain in a unit test suite for CollectionAddAddon.
describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (props = {}) => {
    return defaultRender(<CollectionAddAddon {...props} />, { store });
  };

  it('calls clearTimeout when unmounting and timeout is set', () => {
    const timeoutID = 123;
    const userId = 456;
    const setTimeoutSpy = jest.fn(() => timeoutID);
    const clearTimeoutSpy = jest.fn();
    const { unmount } = render({
      clearTimeout: clearTimeoutSpy,
      setTimeout: setTimeoutSpy,
    });

    store.dispatch(
      addonAddedToCollection({
        addonId: 123,
        collectionId: 987,
        userId,
      }),
    );

    expect(setTimeoutSpy).toHaveBeenCalled();

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutID);
  });

  it('does not call clearTimeout when unmounting and there is no timeout set', () => {
    const clearTimeoutSpy = jest.fn();

    const { unmount } = render({
      clearTimeout: clearTimeoutSpy,
    });

    unmount();

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });
});
