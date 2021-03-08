import * as React from 'react';

import SearchTools, { SearchToolsBase } from 'amo/pages/SearchTools';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { dispatchClientMetadata, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  it('sends a server redirect to support old search tool URLs', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    shallowUntilTarget(<SearchTools store={store} />, SearchToolsBase);

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: sinon.match('/en-US/android/extensions/category/search-tools/'),
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });
});
