import React from 'react';

import Search from 'amo/components/Search';
import SearchPage, {
  SearchPageBase,
  mapStateToProps,
} from 'amo/components/SearchPage';
import { CLIENT_APP_ANDROID } from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  let store;

  function render({
    location = { query: { page: 2, q: 'burger' } },
    pathname = '/testingsearch/',
    ...props
  } = {}) {
    return shallowUntilTarget(
      <SearchPage
        location={location}
        pathname={pathname}
        store={store}
        {...props}
      />,
      SearchPageBase,
    );
  }

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('renders a SearchPage', () => {
    const root = render();

    expect(root.find(Search)).toHaveLength(1);
  });

  it('enables search filters', () => {
    const root = render();

    expect(root.find(Search)).toHaveProp('enableSearchFilters', true);
  });

  it("doesn't duplicate the clientApp in the URL in the queryParams", () => {
    const root = render({
      location: { query: { page: 3, q: 'fries' } },
    });

    expect(root.find(Search).prop('paginationQueryParams')).toEqual({
      page: 3,
      q: 'fries',
    });
  });

  it('sets the paginationQueryParams from filters', () => {
    const root = render({
      location: {
        query: {
          featured: true,
          page: 2,
          q: 'burger',
          tag: 'firefox57',
        },
      },
    });

    expect(root.find(Search)).toHaveProp('paginationQueryParams', {
      featured: true,
      page: 2,
      q: 'burger',
      tag: 'firefox57',
    });
  });

  it('preserves category in paginationQueryParams', () => {
    const query = {
      // The API is responsible for defining category strings.
      category: 'some-category',
    };

    const root = render({
      location: {
        query: { ...query, q: 'search term' },
      },
    });

    const params = root.find(Search).prop('paginationQueryParams');
    expect(params).toMatchObject(query);
  });

  describe('mapStateToProps()', () => {
    const { state } = dispatchClientMetadata();
    const location = {
      query: {
        page: 2,
        q: 'burger',
      },
    };

    it('returns filters based on location (URL) data', () => {
      expect(mapStateToProps(state, { location })).toEqual({
        filters: {
          page: 2,
          query: 'burger',
        },
      });
    });

    it("ignores clientApp in location's queryParams", () => {
      const badLocation = {
        ...location,
        query: { ...location.query, app: CLIENT_APP_ANDROID },
      };

      expect(mapStateToProps(state, { location: badLocation })).toEqual({
        filters: {
          page: 2,
          query: 'burger',
        },
      });
    });

    it("ignores lang in location's queryParams", () => {
      const badLocation = {
        ...location,
        query: { ...location.query, lang: 'fr' },
      };

      expect(mapStateToProps(state, { location: badLocation })).toEqual({
        filters: {
          page: 2,
          query: 'burger',
        },
      });
    });
  });
});
