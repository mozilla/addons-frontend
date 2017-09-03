import React from 'react';

import Search from 'amo/components/Search';
import SearchPage, {
  SearchPageBase,
  mapStateToProps,
} from 'amo/components/SearchPage';
import { CLIENT_APP_ANDROID } from 'core/constants';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { shallowUntilTarget, getFakeI18nInst } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  function render({
    location = { query: { page: 2, q: 'burger' } },
    pathname = '/testingsearch/',
    i18n = getFakeI18nInst(),
    ...props
  } = {}) {
    return shallowUntilTarget(
      <SearchPage
        location={location}
        pathname={pathname}
        store={store}
        i18n={i18n}
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

  it("doesn't duplicate the clientApp in the URL in the queryParams", () => {
    const root = render({
      location: { query: { page: 3, q: 'fries' } },
    });

    expect(root.find(Search).prop('filters')).toEqual({
      page: 3,
      query: 'fries',
    });
  });

  it('should render Search results on search with query', () => {
    const root = render({
      location: { query: { page: 3, q: 'fries' } },
    });

    expect(root.find(Search)).toHaveLength(1);
  });

  it('should render an error message on empty search', () => {
    const root = render({
      location: { query: { page: 3, q: null } },
    });

    expect(root.find('.SearchContextCard-header')).toHaveText('Enter a search term and try again.');
  });

  it('should render an error message on blank search', () => {
    const root = render({
      location: { query: { page: 3, q: '' } },
    });

    expect(root.find('.SearchContextCard-header')).toHaveText('Enter a search term and try again.');
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
