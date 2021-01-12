import * as React from 'react';

import SearchTools, { SearchToolsBase } from 'amo/pages/SearchTools';
import Search from 'amo/components/Search';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  function render({ ...props } = {}) {
    return shallowUntilTarget(
      <SearchTools store={store} i18n={fakeI18n()} {...props} />,
      SearchToolsBase,
    );
  }

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('should have search component', () => {
    const root = render();
    expect(root.find(Search)).toHaveLength(1);
  });

  it('renders a HeadMetaTags component', () => {
    const root = render();

    expect(root.find(HeadMetaTags)).toHaveLength(1);
    expect(root.find(HeadMetaTags).prop('description')).toMatch(
      /Download Firefox extensions to customize/,
    );
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });

  it('sends a server redirect to support old search tool URLs', () => {
    const fakeDispatch = sinon.spy(store, 'dispatch');

    render();

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: sinon.match('/en-US/android/search/?category=search-tools'),
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });
});
