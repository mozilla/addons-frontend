// We shouldn't use `cleanup()` but this test file uses it anyway in
// `testWithFilters()`, which should be refactored eventually...
// eslint-disable-next-line testing-library/no-manual-cleanup
import { cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setViewContext } from 'amo/actions/viewContext';
import { createApiError } from 'amo/api/index';
import { extractId } from 'amo/components/Search';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DEFAULT_CATEGORY_SORT,
  LINE,
  RECOMMENDED,
  REVIEWED_FILTER,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_RECOMMENDED,
  SEARCH_SORT_RELEVANCE,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
  SEARCH_SORT_POPULAR,
  SET_VIEW_CONTEXT,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import { fetchCategories, loadCategories } from 'amo/reducers/categories';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { SEARCH_STARTED, searchStart } from 'amo/reducers/search';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import {
  createFailedErrorHandler,
  dispatchClientMetadata,
  dispatchSearchResults,
  fakeAddon,
  fakeCategory,
  getElement,
  getElements,
  getSearchErrorHandlerId,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let history;
  let store;
  const lang = 'en-US';
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultLocation = `/${lang}/${clientApp}/search/`;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const getLocation = ({ category, query, tag, type }) => {
    let location = `${defaultLocation}?`;
    if (category) {
      location = `${location}&category=${category}`;
    }
    if (query) {
      location = `${location}&q=${query}`;
    }
    if (tag) {
      location = `${location}&tag=${tag}`;
    }
    if (type) {
      location = `${location}&type=${type}`;
    }
    return location;
  };

  function render({ category, location, query, tag, type } = {}) {
    const renderOptions = {
      initialEntries: [location || getLocation({ category, query, tag, type })],
      store,
    };

    const renderResult = defaultRender(renderOptions);
    history = renderResult.history;
    return renderResult;
  }

  const _searchStart = ({ filters = {} } = {}) => {
    store.dispatch(
      searchStart({ errorHandlerId: getSearchErrorHandlerId(), filters }),
    );
  };

  const _dispatchSearchResults = async (args = {}) =>
    dispatchSearchResults({ store, ...args });

  const _loadCategories = ({
    results = [
      {
        ...fakeCategory,
        type: ADDON_TYPE_STATIC_THEME,
        name: 'Causes',
        slug: 'causes',
      },
      {
        ...fakeCategory,
        type: ADDON_TYPE_EXTENSION,
        name: 'Causes',
        slug: 'causes',
      },
    ],
  } = {}) => {
    store.dispatch(loadCategories({ results }));
  };

  const renderWithResults = async ({
    count = 5,
    filterProps = {},
    page = '1',
    pageSize = 2,
    query,
    pageCount = 4,
  } = {}) => {
    const addons = Array(pageSize).fill(fakeAddon);
    const filters = { page, ...filterProps };
    if (query) {
      filters.query = query;
    }
    await _dispatchSearchResults({
      addons,
      count,
      filters,
      pageSize,
      pageCount,
    });
    let location = `${defaultLocation}?page=${page}`;
    if (query) {
      location = `${location}&q=${query}`;
    }
    for (const key of Object.keys(filterProps)) {
      location = `${location}&${key}=${filterProps[key]}`;
    }
    return render({ location });
  };

  it('preserves category in paginationQueryParams', async () => {
    const category = 'some-category';
    const page = '2';
    const query = 'fries';
    await renderWithResults({ filterProps: { category }, page, query });

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      `${defaultLocation}?category=${category}&page=1&q=${query}`,
    );
  });

  it('dispatches a server redirect when `atype` parameter is "1"', () => {
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    render({ location: `${defaultLocation}?atype=1` });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/search/?type=extension`,
      }),
    );
    // Once for the LOCATION_CHANGE before render.
    // Once for the re-direct.
    // Once for SEARCH_STARTED, after the re-redirect.
    expect(fakeDispatch).toHaveBeenCalledTimes(3);
  });

  it('uses the clientApp from the API and not the location', () => {
    dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, lang, store });
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    render({ location: `/${lang}/${CLIENT_APP_FIREFOX}/search/?atype=1` });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${CLIENT_APP_ANDROID}/search/?type=extension`,
      }),
    );
  });

  it('uses the lang from the API and not the location', () => {
    const apiLang = 'en-CA';
    dispatchClientMetadata({ clientApp, lang: apiLang, store });
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    render({ location: `/en-US/${CLIENT_APP_FIREFOX}/search/?atype=1` });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${apiLang}/${clientApp}/search/?type=extension`,
      }),
    );
  });

  it('dispatches a server redirect when `atype` parameter is "3"', () => {
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    render({ location: `${defaultLocation}?atype=3` });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/search/?type=dictionary`,
      }),
    );
  });

  it('dispatches a server redirect when `atype` parameter is "5"', () => {
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    render({ location: `${defaultLocation}?atype=5` });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/search/?type=language`,
      }),
    );
  });

  it('does not dispatch a server redirect when `atype` has no mapping', () => {
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    // The `atype` value has no corresponding `addonType`.
    render({ location: `${defaultLocation}?atype=123` });

    expect(fakeDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SEND_SERVER_REDIRECT' }),
    );
  });

  it('dispatches a server redirect when `category` and `addonType` are set', () => {
    const category = 'some-category';
    const page = '123';
    const fakeDispatch = jest.spyOn(store, 'dispatch');
    const location = [
      `${defaultLocation}?category=${category}`,
      `page=${page}`,
      `sort=${SEARCH_SORT_RECOMMENDED}`,
      `type=${ADDON_TYPE_EXTENSION}`,
    ].join('&');

    render({ location });

    const url = [
      `/${lang}/${clientApp}/extensions/category/${category}/?page=${page}`,
      `sort=${SEARCH_SORT_RECOMMENDED}`,
    ].join('&');
    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({ status: 301, url }),
    );
  });

  it('does not dispatch a server redirect when category is set along with an invalid `addonType`', () => {
    const category = 'some-category';
    const page = '123';
    const fakeDispatch = jest.spyOn(store, 'dispatch');
    const location = [
      `${defaultLocation}?category=${category}`,
      `page=${page}`,
      `sort=${SEARCH_SORT_RECOMMENDED}`,
      'type=invalid',
    ].join('&');

    render({ location });

    expect(fakeDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SEND_SERVER_REDIRECT' }),
    );
  });

  it('removes the default category sort, when present, when redirecting', () => {
    const category = 'some-category';
    const page = '123';
    const fakeDispatch = jest.spyOn(store, 'dispatch');
    const location = [
      `${defaultLocation}?category=${category}`,
      `page=${page}`,
      `sort=${DEFAULT_CATEGORY_SORT}`,
      `type=${ADDON_TYPE_EXTENSION}`,
    ].join('&');

    render({ location });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/extensions/category/${category}/?page=${page}`,
      }),
    );
  });

  it('dispatches a server redirect when `tag` is set', () => {
    const tag = 'some-tag';
    const page = '123';
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    const location = [
      `${defaultLocation}?tag=${tag}`,
      `page=${page}`,
      `sort=${SEARCH_SORT_RECOMMENDED}`,
      `type=${ADDON_TYPE_EXTENSION}`,
    ].join('&');

    render({ location });

    const url = [
      `/${lang}/${clientApp}/tag/${tag}/?page=${page}`,
      `sort=${SEARCH_SORT_RECOMMENDED}`,
      `type=${ADDON_TYPE_EXTENSION}`,
    ].join('&');
    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({ status: 301, url }),
    );
  });

  it('removes the default tag sort, when present, when redirecting', () => {
    const tag = 'some-tag';
    const page = '123';
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    const location = [
      `${defaultLocation}?tag=${tag}`,
      `page=${page}`,
      `sort=${DEFAULT_CATEGORY_SORT}`,
    ].join('&');

    render({ location });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `/${lang}/${clientApp}/tag/${tag}/?page=${page}`,
      }),
    );
  });

  it('dispatches a server redirect when `platform` is set', () => {
    const fakeDispatch = jest.spyOn(store, 'dispatch');

    render({ location: `${defaultLocation}?platform=whatever` });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: defaultLocation,
      }),
    );
  });

  it('redirects without affecting the other parameters', () => {
    const fakeDispatch = jest.spyOn(store, 'dispatch');
    const page = '123';

    render({ location: `${defaultLocation}?page=${page}&platform=whatever` });

    expect(fakeDispatch).toHaveBeenCalledWith(
      sendServerRedirect({
        status: 301,
        url: `${defaultLocation}?page=123`,
      }),
    );
  });

  describe('Tests for Search', () => {
    it('renders results', async () => {
      await renderWithResults();

      expect(
        screen.getAllByRole('link', { name: fakeAddon.name['en-US'] }),
      ).toHaveLength(2);
    });

    it('passes a Paginate component to the SearchResults component', async () => {
      const page = '2';
      const query = 'foo';
      const pageCount = 4;

      await renderWithResults({ page, query, pageCount });

      // Check that we use the "pageCount" item from store to compute the number of pages, NOT the "count" item.
      expect(screen.getByText('Page 2 of 4')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
        'href',
        `${defaultLocation}?page=1&q=${query}`,
      );
    });

    it('dispatches the search on mount', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const query = 'foo';
      render({ query });

      expect(dispatch).toHaveBeenCalledWith(
        searchStart({
          errorHandlerId: getSearchErrorHandlerId(),
          filters: { query },
        }),
      );
    });

    it('does not dispatch on mount if filters exist and have not changed', () => {
      const query = 'foo';
      _searchStart({
        filters: { query },
      });
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ query });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: SEARCH_STARTED }),
      );
    });

    it('dispatches a search when a sort option is selected', async () => {
      const page = '1';
      const query = 'foo';
      const dispatch = jest.spyOn(store, 'dispatch');
      await renderWithResults({ page, query });

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Sort by' }),
        'Relevance',
      );
      expect(dispatch).toHaveBeenCalledWith(
        searchStart({
          errorHandlerId: getSearchErrorHandlerId(page),
          filters: { page, query, sort: 'relevance' },
        }),
      );
    });

    it('dispatches a search when filters become empty', async () => {
      const page = '1';
      const query = 'foo';
      const dispatch = jest.spyOn(store, 'dispatch');
      await renderWithResults({ page, query });

      await userEvent.clear(screen.getByRole('searchbox'));
      await userEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(dispatch).toHaveBeenCalledWith(
        searchStart({
          errorHandlerId: getSearchErrorHandlerId(),
          filters: {},
        }),
      );
    });

    it('sets the viewContext to the addonType if addonType exists', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render({
        location: `${defaultLocation}?q=foo&type=${ADDON_TYPE_EXTENSION}`,
      });

      expect(dispatch).toHaveBeenCalledWith(
        setViewContext(ADDON_TYPE_EXTENSION),
      );
    });

    it('renders a robots meta tag when there are no results', async () => {
      render();

      await waitFor(() =>
        expect(getElement('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex, follow',
        ),
      );
    });

    it('does not render a robots meta tag when there are results', async () => {
      await renderWithResults();

      await waitFor(() => expect(getElement('title')).toBeInTheDocument());

      expect(getElements('meta[name="robots"]')).toHaveLength(0);
    });

    it('does not render a robots meta tag when there is an error', async () => {
      createFailedErrorHandler({
        id: getSearchErrorHandlerId(),
        error: createApiError({ response: { status: 400 } }),
        store,
      });
      render();

      await waitFor(() => expect(getElement('title')).toBeInTheDocument());

      expect(getElements('meta[name="robots"]')).toHaveLength(0);
    });

    it('should render an error', () => {
      const message = 'Some error message';
      createFailedErrorHandler({
        id: getSearchErrorHandlerId(),
        message,
        store,
      });
      render();

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it.each([
      [{}, 'Search results'],
      [
        { type: ADDON_TYPE_EXTENSION, promoted: RECOMMENDED },
        'Recommended extensions',
      ],
      [
        { type: ADDON_TYPE_STATIC_THEME, promoted: RECOMMENDED },
        'Recommended themes',
      ],
      [{ type: ADDON_TYPE_LANG, promoted: RECOMMENDED }, 'Recommended add-ons'],
      [{ type: ADDON_TYPE_EXTENSION, promoted: LINE }, 'Extensions by Firefox'],
      [{ type: ADDON_TYPE_STATIC_THEME, promoted: LINE }, 'Themes by Firefox'],
      [{ type: ADDON_TYPE_LANG, promoted: LINE }, 'Add-ons by Firefox'],
      [
        { type: ADDON_TYPE_EXTENSION, promoted: REVIEWED_FILTER },
        'Reviewed extensions',
      ],
      [
        { type: ADDON_TYPE_STATIC_THEME, promoted: REVIEWED_FILTER },
        'Reviewed themes',
      ],
      [
        { type: ADDON_TYPE_LANG, promoted: REVIEWED_FILTER },
        'Reviewed add-ons',
      ],
      [
        { type: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_TRENDING },
        'Trending extensions',
      ],
      [
        { type: ADDON_TYPE_STATIC_THEME, sort: SEARCH_SORT_TRENDING },
        'Trending themes',
      ],
      [
        { type: ADDON_TYPE_LANG, sort: SEARCH_SORT_TRENDING },
        'Trending add-ons',
      ],
      [
        { type: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_TOP_RATED },
        'Top rated extensions',
      ],
      [
        { type: ADDON_TYPE_STATIC_THEME, sort: SEARCH_SORT_TOP_RATED },
        'Top rated themes',
      ],
      [
        { type: ADDON_TYPE_LANG, sort: SEARCH_SORT_TOP_RATED },
        'Top rated add-ons',
      ],
      [
        { type: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_POPULAR },
        'Popular extensions',
      ],
      [
        { type: ADDON_TYPE_STATIC_THEME, sort: SEARCH_SORT_POPULAR },
        'Popular themes',
      ],
      [{ type: ADDON_TYPE_LANG, sort: SEARCH_SORT_POPULAR }, 'Popular add-ons'],
      [{ q: 'search term' }, 'Search results for "search term"'],
    ])('renders an HTML title for %s', async (filterProps, title) => {
      let location = `${defaultLocation}?`;
      for (const key of Object.keys(filterProps)) {
        location = `${location}&${key}=${filterProps[key]}`;
      }

      render({ location });

      await waitFor(() =>
        expect(getElement('title')).toHaveTextContent(
          `${title} – Add-ons for Firefox (en-US)`,
        ),
      );
    });

    it('sets the viewContext to exploring if viewContext has changed', () => {
      store.dispatch(setViewContext(ADDON_TYPE_EXTENSION));
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).toHaveBeenCalledWith(setViewContext(VIEW_CONTEXT_HOME));
    });

    it('does not set the viewContext if already set to exploring', () => {
      store.dispatch(setViewContext(VIEW_CONTEXT_HOME));
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: SET_VIEW_CONTEXT }),
      );
    });

    it.each([400, 404])(
      'returns a Not Found page when error is %s',
      (status) => {
        createFailedErrorHandler({
          id: getSearchErrorHandlerId(),
          error: createApiError({ response: { status } }),
          store,
        });
        render();

        expect(
          screen.getByText('Oops! We can’t find that page'),
        ).toBeInTheDocument();
      },
    );

    describe('errorHandler - extractId', () => {
      it('generates a unique ID based on the page filter', () => {
        const ownProps = { filters: { page: '123' } };

        expect(extractId(ownProps)).toEqual('123');
      });

      it('generates a unique ID even when there is no page filter', () => {
        const ownProps = { filters: { page: undefined } };

        expect(extractId(ownProps)).toEqual(undefined);
      });
    });
  });

  describe('Tests for SearchFilters', () => {
    it('changes the URL when a new addonType filter is selected', async () => {
      const query = 'foo';

      await renderWithResults({ query });
      const pushSpy = jest.spyOn(history, 'push');

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Add-on Type' }),
        'Extension',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          addonType: ADDON_TYPE_EXTENSION,
          page: '1',
          query,
        }),
      });
    });

    it('changes the URL when a new sort filter is selected', async () => {
      const query = 'foo';

      await renderWithResults({ query });
      const pushSpy = jest.spyOn(history, 'push');

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Sort by' }),
        'Trending',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          page: '1',
          query,
          sort: SEARCH_SORT_TRENDING,
        }),
      });
    });

    it('changes the URL when a new promoted filter is selected', async () => {
      const query = 'foo';

      await renderWithResults({ query });
      const pushSpy = jest.spyOn(history, 'push');

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Badging' }),
        'Recommended',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          page: '1',
          promoted: RECOMMENDED,
          query,
        }),
      });
    });

    it('selects the sort criterion in the sort select', () => {
      const sort = SEARCH_SORT_TRENDING;
      render({ location: `${defaultLocation}?sort=${sort}` });

      expect(screen.getByRole('option', { name: 'Trending' }).selected).toEqual(
        true,
      );
    });

    it.each([
      `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_TRENDING}`,
      `${SEARCH_SORT_TRENDING},${SEARCH_SORT_RECOMMENDED}`,
      `${SEARCH_SORT_TRENDING},${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_RELEVANCE}`,
    ])(
      'selects the first non-recommended sort criterion in the sort select: %s',
      (sort) => {
        render({ location: `${defaultLocation}?sort=${sort}` });

        expect(
          screen.getByRole('option', { name: 'Trending' }).selected,
        ).toEqual(true);
      },
    );

    it('selects SEARCH_SORT_RELEVANCE in the sort select if there is no sort criteria', () => {
      render();

      expect(
        screen.getByRole('option', { name: 'Relevance' }).selected,
      ).toEqual(true);
    });

    it('selects SEARCH_SORT_RELEVANCE if the only the sort criterion is SEARCH_SORT_RECOMMENDED', () => {
      render({
        location: `${defaultLocation}?sort=${SEARCH_SORT_RECOMMENDED}`,
      });

      expect(
        screen.getByRole('option', { name: 'Relevance' }).selected,
      ).toEqual(true);
    });

    it('selects the promoted criterion in the promoted select', () => {
      render({ location: `${defaultLocation}?promoted=${RECOMMENDED}` });

      expect(
        screen.getByRole('option', { name: 'Recommended' }).selected,
      ).toEqual(true);
    });

    it('deletes the filter if it is empty', async () => {
      const query = 'foo';
      const type = ADDON_TYPE_EXTENSION;

      await renderWithResults({ filterProps: { type }, query });
      const pushSpy = jest.spyOn(history, 'push');

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Add-on Type' }),
        'All',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          page: '1',
          query,
        }),
      });
    });

    it('does not change the URL when the same filter is selected', async () => {
      const query = 'foo';
      const type = ADDON_TYPE_EXTENSION;

      await renderWithResults({ filterProps: { type }, query });
      const pushSpy = jest.spyOn(history, 'push');

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Add-on Type' }),
        'Extension',
      );

      expect(pushSpy).not.toHaveBeenCalled();
    });

    it('does not pass sort=random when a promoted filter is not selected', async () => {
      const promoted = RECOMMENDED;
      const sort = SEARCH_SORT_RANDOM;

      await renderWithResults({ filterProps: { promoted, sort } });
      const pushSpy = jest.spyOn(history, 'push');

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Badging' }),
        'Any',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({ page: '1' }),
      });
    });

    it('resets the page filter when a select is updated', async () => {
      const query = 'foo';
      const page = '2';

      await renderWithResults({ page, query });
      const pushSpy = jest.spyOn(history, 'push');

      await userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Add-on Type' }),
        'Extension',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          addonType: ADDON_TYPE_EXTENSION,
          page: '1',
          query,
        }),
      });
    });

    it('displays the badging filter but not the addonType one on Android', () => {
      dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, store });
      render({ location: `/${lang}/${CLIENT_APP_ANDROID}/search/` });

      expect(
        screen.queryByRole('combobox', { name: 'Add-on Type' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: 'Badging' }),
      ).toBeInTheDocument();
    });
  });

  describe('Tests for SearchContextCard', () => {
    const thisErrorHandlerId = 'SearchContextCard';

    it('should render "Searching" text while search loading without query', () => {
      _searchStart();
      render();

      expect(
        screen.getByRole('heading', { name: 'Searching for add-ons' }),
      ).toBeInTheDocument();
    });

    it('should render during a search that is search loading', () => {
      const query = 'test';
      _searchStart({ filters: { query } });
      render({ query });

      expect(
        screen.getByRole('heading', { name: `Searching for "${query}"` }),
      ).toBeInTheDocument();
    });

    it('should fetch categories if there is a category filter', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ category: 'causes' });

      expect(dispatch).toHaveBeenCalledWith(
        fetchCategories({ errorHandlerId: thisErrorHandlerId }),
      );
    });

    it('should not fetch categories if there is no category filter', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render();

      expect(dispatch).not.toHaveBeenCalledWith(
        fetchCategories({ errorHandlerId: thisErrorHandlerId }),
      );
    });

    it('should not fetch categories if there is a category filter and there is a categoryName', () => {
      _loadCategories();
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ category: 'causes', type: ADDON_TYPE_STATIC_THEME });

      expect(dispatch).not.toHaveBeenCalledWith(
        fetchCategories({ errorHandlerId: thisErrorHandlerId }),
      );
    });

    // Tests without any type filter.
    it.each([
      // No results, no filters.
      [{ count: 0, expected: '0 results found' }],
      // One result, no filters.
      [{ count: 1, expected: '1 result found' }],
      // Multiple results, no filters.
      [{ count: 2, expected: '2 results found' }],
      // One result, just a query.
      [{ count: 1, query: 'test', expected: '1 result found for "test"' }],
      // Multiple results, just a query.
      [{ count: 2, query: 'test', expected: '2 results found for "test"' }],
    ])(
      'should (old) render the expected header for %s results, category: %s, query: %s, tag: %s',
      async ({ count, query, expected }) => {
        _loadCategories();

        const filters = {};
        if (query) {
          filters.query = query;
        }
        await _dispatchSearchResults({
          addons: Array(count).fill(fakeAddon),
          filters,
        });

        render({ query });

        expect(
          screen.getByRole('heading', { name: expected }),
        ).toBeInTheDocument();
      },
    );

    const testData = (type, singular, plural) => [
      // Only type filter.
      {
        filters: { addonType: type },
        expectedSingular: `1 ${singular} found`,
        expectedPlural: `2 ${plural} found`,
      },
      // Just query.
      {
        filters: { addonType: type, query: 'test' },
        expectedSingular: `1 ${singular} found for "test"`,
        expectedPlural: `2 ${plural} found for "test"`,
      },
      // Just category.
      {
        filters: { addonType: type, category: 'causes' },
        expectedSingular: `1 ${singular} found in Causes`,
        expectedPlural: `2 ${plural} found in Causes`,
      },
      // Just tag.
      {
        filters: { addonType: type, tag: 'someTag' },
        expectedSingular: `1 ${singular} found with tag someTag`,
        expectedPlural: `2 ${plural} found with tag someTag`,
      },
      // Query and category.
      {
        filters: { addonType: type, category: 'causes', query: 'test' },
        expectedSingular: `1 ${singular} found for "test" in Causes`,
        expectedPlural: `2 ${plural} found for "test" in Causes`,
      },
      // Query and tag.
      {
        filters: { addonType: type, query: 'test', tag: 'someTag' },
        expectedSingular: `1 ${singular} found for "test" with tag someTag`,
        expectedPlural: `2 ${plural} found for "test" with tag someTag`,
      },
      // Category and tag.
      {
        filters: { addonType: type, category: 'causes', tag: 'someTag' },
        expectedSingular: `1 ${singular} found with tag someTag in Causes`,
        expectedPlural: `2 ${plural} found with tag someTag in Causes`,
      },
      // Query, category and tag.
      {
        filters: {
          addonType: type,
          category: 'causes',
          query: 'test',
          tag: 'someTag',
        },
        expectedSingular: `1 ${singular} found for "test" with tag someTag in Causes`,
        expectedPlural: `2 ${plural} found for "test" with tag someTag in Causes`,
      },
    ];

    const testWithFilters = async (
      filters,
      expectedSingular,
      expectedPlural,
    ) => {
      // Category is only displayed for extensions and themes, so skip if not
      // one of those.
      if (
        ![ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME].includes(
          filters.addonType,
        ) &&
        filters.category
      ) {
        return true;
      }

      const params = { ...filters, type: filters.addonType };
      delete params.addonType;

      render(params);
      await _dispatchSearchResults({
        addons: [fakeAddon],
        filters,
      });

      expect(
        await screen.findByRole('heading', { name: expectedSingular }),
      ).toBeInTheDocument();

      cleanup();

      render(params);
      await _dispatchSearchResults({
        addons: [fakeAddon, fakeAddon],
        filters,
      });

      expect(
        await screen.findByRole('heading', { name: expectedPlural }),
      ).toBeInTheDocument();

      cleanup();

      return true;
    };

    it.each(testData(ADDON_TYPE_EXTENSION, 'extension', 'extensions'))(
      'should render the expected headers for extensions for %s',
      async ({ filters, expectedSingular, expectedPlural }) => {
        _loadCategories();

        expect(
          await testWithFilters(filters, expectedSingular, expectedPlural),
        ).toBeTruthy();
      },
    );

    it.each(testData(ADDON_TYPE_STATIC_THEME, 'theme', 'themes'))(
      'should render the expected headers for themes for %s',
      async ({ filters, expectedSingular, expectedPlural }) => {
        _loadCategories();

        expect(
          await testWithFilters(filters, expectedSingular, expectedPlural),
        ).toBeTruthy();
      },
    );

    it.each(testData(ADDON_TYPE_LANG, 'result', 'results'))(
      'should render the expected headers for lang packs for %s',
      async ({ filters, expectedSingular, expectedPlural }) => {
        _loadCategories();

        expect(
          await testWithFilters(filters, expectedSingular, expectedPlural),
        ).toBeTruthy();
      },
    );

    it('should render results with categoryName for addonType ADDON_TYPE_EXTENSION for android', async () => {
      dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID, store });

      const category = 'experimental';
      const categoryName = 'Experimental';

      _loadCategories({
        results: [
          {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX, // Unified categories ignore android applications
            type: ADDON_TYPE_EXTENSION,
            name: categoryName,
            slug: category,
          },
        ],
      });

      await _dispatchSearchResults({
        filters: {
          addonType: ADDON_TYPE_EXTENSION,
          category,
        },
      });

      render({
        location: `/${lang}/${CLIENT_APP_ANDROID}/search/?category=${category}&type=${ADDON_TYPE_EXTENSION}`,
      });

      expect(
        screen.getByRole('heading', {
          name: `2 extensions found in ${categoryName}`,
        }),
      ).toBeInTheDocument();
    });

    it('does not render a categoryName when the category is invalid', async () => {
      const category = 'bad-category';
      await _dispatchSearchResults({
        // The API does not return addon results if the category is invalid.
        addons: [],
        filters: {
          category,
        },
      });

      render({ category });

      expect(
        screen.getByRole('heading', { name: '0 results found' }),
      ).toBeInTheDocument();
    });
  });
});
