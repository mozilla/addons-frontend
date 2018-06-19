import * as React from 'react';

import SearchTools, { SearchToolsBase } from 'amo/components/SearchTools';
import Search from 'amo/components/Search';
import { ADDON_TYPE_OPENSEARCH, SEARCH_SORT_RELEVANCE } from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  function render({ ...props } = {}) {
    return shallowUntilTarget(
      <SearchTools store={store} {...props} />,
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

  it('search component should have `search` props', () => {
    const root = render();
    expect(root.find(Search)).toHaveProp('filters', {
      addonType: ADDON_TYPE_OPENSEARCH,
      sort: SEARCH_SORT_RELEVANCE,
    });
  });
});
