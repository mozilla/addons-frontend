import { waitFor } from '@testing-library/react';
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
  VERIFIED_FILTER,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { SEARCH_STARTED, searchStart } from 'amo/reducers/search';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import {
  createFailedErrorHandler,
  createHistory,
  dispatchClientMetadata,
  dispatchSearchResults,
  fakeAddon,
  getElement,
  getElements,
  getSearchErrorHandlerId,
  renderPage as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  const lang = 'en-US';
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultLocation = `/${lang}/${clientApp}/search/`;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  function render({ history, location = defaultLocation, term } = {}) {
    const renderOptions = {
      history:
        history ||
        createHistory({
          initialEntries: [term ? `${defaultLocation}?q=${term}` : location],
        }),
      store,
    };
    return defaultRender(renderOptions);
  }

  const renderWithResults = ({
    count = 5,
    filterProps = {},
    history,
    page = '1',
    pageSize = 2,
    term,
  } = {}) => {
    const addons = Array(pageSize).fill(fakeAddon);
    const filters = { page, ...filterProps };
    if (term) {
      filters.query = term;
    }
    dispatchSearchResults({ addons, count, filters, pageSize, store });
    let location = `${defaultLocation}?page=${page}`;
    if (term) {
      location = `${location}&q=${term}`;
    }
    for (const key of Object.keys(filterProps)) {
      location = `${location}&${key}=${filterProps[key]}`;
    }
    render({ history, location });
  };

  it("doesn't duplicate the clientApp in the URL in the queryParams", async () => {
    const page = '2';
    const term = 'fries';
    renderWithResults({ page, term });

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      `${defaultLocation}?page=1&q=${term}`,
    );
  });

  it('preserves category in paginationQueryParams', () => {
    const category = 'some-category';
    const page = '2';
    const term = 'fries';
    renderWithResults({ filterProps: { category }, page, term });

    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      `${defaultLocation}?category=${category}&page=1&q=${term}`,
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
    // Once for the initial LOCATION_CHANGE.
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
    it('renders results', () => {
      renderWithResults();

      expect(
        screen.getAllByRole('link', { name: fakeAddon.name['en-US'] }),
      ).toHaveLength(2);
    });

    it('passes a Paginate component to the SearchResults component', () => {
      const page = '2';
      const term = 'foo';
      renderWithResults({ page, term });

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
        'href',
        `${defaultLocation}?page=1&q=${term}`,
      );
    });

    it('dispatches the search on mount', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      const term = 'foo';
      render({ term });

      expect(dispatch).toHaveBeenCalledWith(
        searchStart({
          errorHandlerId: getSearchErrorHandlerId(),
          filters: { query: term },
        }),
      );
    });

    it('does not dispatch on mount if filters exist and have not changed', () => {
      const term = 'foo';
      store.dispatch(
        searchStart({
          errorHandlerId: getSearchErrorHandlerId(),
          filters: { query: term },
        }),
      );
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ term });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: SEARCH_STARTED }),
      );
    });

    it('dispatches a search when a sort option is selected', () => {
      const page = '1';
      const term = 'foo';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithResults({ page, term });

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Sort by' }),
        'Relevance',
      );
      expect(dispatch).toHaveBeenCalledWith(
        searchStart({
          errorHandlerId: getSearchErrorHandlerId(page),
          filters: { page, query: term, sort: 'relevance' },
        }),
      );
    });

    it('dispatches a search when filters become empty', () => {
      const page = '1';
      const term = 'foo';
      const dispatch = jest.spyOn(store, 'dispatch');
      renderWithResults({ page, term });

      userEvent.type(screen.getByRole('searchbox'), '{selectall}{del}');
      userEvent.click(screen.getByRole('button', { name: 'Search' }));

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

      await waitFor(() => expect(getElement('title')).toBeInTheDocument());

      expect(getElement('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, follow',
      );
    });

    it('does not render a robots meta tag when there are results', async () => {
      renderWithResults();

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
        { type: ADDON_TYPE_EXTENSION, promoted: VERIFIED_FILTER },
        'Verified extensions',
      ],
      [
        { type: ADDON_TYPE_STATIC_THEME, promoted: VERIFIED_FILTER },
        'Verified themes',
      ],
      [
        { type: ADDON_TYPE_LANG, promoted: VERIFIED_FILTER },
        'Verified add-ons',
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

      await waitFor(() => expect(getElement('title')).toBeInTheDocument());

      expect(getElement('title')).toHaveTextContent(
        `${title} – Add-ons for Firefox (en-US)`,
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
    it('changes the URL when a new addonType filter is selected', () => {
      const term = 'foo';
      const history = createHistory({
        initialEntries: [`${defaultLocation}?q=${term}`],
      });
      const pushSpy = jest.spyOn(history, 'push');

      renderWithResults({ history, term });

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Add-on Type' }),
        'Extension',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          addonType: ADDON_TYPE_EXTENSION,
          query: term,
        }),
      });
    });

    it('changes the URL when a new sort filter is selected', () => {
      const term = 'foo';
      const history = createHistory({
        initialEntries: [`${defaultLocation}?q=${term}`],
      });
      const pushSpy = jest.spyOn(history, 'push');

      renderWithResults({ history, term });

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Sort by' }),
        'Trending',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          query: term,
          sort: SEARCH_SORT_TRENDING,
        }),
      });
    });

    it('changes the URL when a new promoted filter is selected', () => {
      const term = 'foo';
      const history = createHistory({
        initialEntries: [`${defaultLocation}?q=${term}`],
      });
      const pushSpy = jest.spyOn(history, 'push');

      renderWithResults({ history, term });

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Badging' }),
        'Recommended',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          promoted: RECOMMENDED,
          query: term,
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

    it('deletes the filter if it is empty', () => {
      const term = 'foo';
      const type = ADDON_TYPE_EXTENSION;
      const history = createHistory({
        initialEntries: [`${defaultLocation}?q=${term}&type=${type}`],
      });
      const pushSpy = jest.spyOn(history, 'push');

      renderWithResults({ history, filterProps: { type }, term });

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Add-on Type' }),
        'All',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          query: term,
        }),
      });
    });

    it('does not change the URL when the same filter is selected', () => {
      const term = 'foo';
      const type = ADDON_TYPE_EXTENSION;
      const history = createHistory({
        initialEntries: [`${defaultLocation}?q=${term}&type=${type}`],
      });
      const pushSpy = jest.spyOn(history, 'push');

      renderWithResults({ history, filterProps: { type }, term });

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Add-on Type' }),
        'Extension',
      );

      expect(pushSpy).not.toHaveBeenCalled();
    });

    it('does not pass sort=random when a promoted filter is not selected', () => {
      const promoted = RECOMMENDED;
      const sort = SEARCH_SORT_RANDOM;
      const history = createHistory({
        initialEntries: [
          `${defaultLocation}?promoted=${promoted}&sort=${sort}`,
        ],
      });
      const pushSpy = jest.spyOn(history, 'push');

      renderWithResults({ history, filterProps: { promoted, sort } });

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Badging' }),
        'Any',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({}),
      });
    });

    it('resets the page filter when a select is updated', () => {
      const term = 'foo';
      const page = '2';
      const history = createHistory({
        initialEntries: [`${defaultLocation}?q=${term}&page=${page}`],
      });
      const pushSpy = jest.spyOn(history, 'push');

      renderWithResults({ history, page, term });

      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Add-on Type' }),
        'Extension',
      );

      expect(pushSpy).toHaveBeenCalledWith({
        pathname: defaultLocation,
        query: convertFiltersToQueryParams({
          addonType: ADDON_TYPE_EXTENSION,
          page: '1',
          query: term,
        }),
      });
    });

    it('does not display the addonType or badging filters on Android', () => {
      render({ location: `/${lang}/${CLIENT_APP_ANDROID}/search/` });

      expect(
        screen.queryByRole('combobox', { name: 'Add-on Type' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('combobox', { name: 'Badging' }),
      ).not.toBeInTheDocument();
    });
  });
});
