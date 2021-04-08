import * as React from 'react';

import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import SearchTools, { SearchToolsBase } from 'amo/pages/SearchTools';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { dispatchClientMetadata, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <SearchTools store={store} {...props} />,
      SearchToolsBase,
    );
  };

  it('sends a server redirect to support old search tool URLs', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render({ store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: sinon.match('/en-US/android/extensions/category/search-tools/'),
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('renders a NotFoundPage', () => {
    const root = render();

    expect(root.find(NotFoundPage)).toHaveLength(1);
  });
});
