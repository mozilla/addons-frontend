import * as React from 'react';

import Search from 'amo/components/Search';
import TagPage, { TagPageBase } from 'amo/pages/TagPage';
import {
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RECOMMENDED,
} from 'amo/constants';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  const defaultParams = {
    tag: 'some-tag',
  };

  function render({ params = defaultParams, ...props } = {}) {
    return shallowUntilTarget(
      <TagPage i18n={fakeI18n()} match={{ params }} store={store} {...props} />,
      TagPageBase,
    );
  }

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX }).store;
  });

  it('renders a Search component', () => {
    const root = render();

    expect(root.find(Search)).toHaveLength(1);
    expect(root.find(Search)).toHaveProp('enableSearchFilters', true);
  });

  it('adds tag and sort to Search filters', () => {
    const tag = 'some-tag';

    const root = render({
      params: {
        tag,
      },
    });

    expect(root.find(Search).prop('filters')).toEqual({
      tag,
      sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
    });
  });

  it('does not override an existing sort filter', () => {
    const tag = 'some-tag';

    dispatchClientMetadata({
      store,
      search: `?sort=${SEARCH_SORT_POPULAR}`,
    });

    const root = render({
      params: {
        tag,
      },
    });

    expect(root.find(Search).prop('filters')).toEqual({
      tag,
      sort: SEARCH_SORT_POPULAR,
    });
  });

  it('sets the paginationQueryParams from filters, excluding tag', () => {
    const page = '2';
    const q = 'testQ';

    dispatchClientMetadata({
      store,
      search: `?page=${page}&q=${q}`,
    });

    const root = render({
      params: {
        tag: 'some-tag',
      },
    });

    expect(root.find(Search)).toHaveProp('paginationQueryParams', {
      page,
      q,
    });
  });

  it('sets the pathname using the tag', () => {
    const tag = 'some-tag';

    const root = render({
      params: {
        tag,
      },
    });

    expect(root.find(Search)).toHaveProp('pathname', `/tag/${tag}/`);
  });

  it('sets the expected title for the tag', () => {
    const tag = 'some-tag';

    const root = render({
      params: {
        tag,
      },
    });

    expect(root.find(Search)).toHaveProp(
      'pageTitle',
      `Add-ons tagged with ${tag}`,
    );
  });
});
