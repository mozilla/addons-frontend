import { shallow } from 'enzyme';
import * as React from 'react';

import NotFound from 'amo/components/Errors/NotFound';
import Search, { SearchBase, extractId } from 'amo/components/Search';
import SearchFilters from 'amo/components/SearchFilters';
import SearchResults from 'amo/components/SearchResults';
import { setViewContext } from 'amo/actions/viewContext';
import Paginate from 'amo/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  LINE,
  RECOMMENDED,
  REVIEWED_FILTER,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
  SEARCH_SORT_POPULAR,
  VERIFIED_FILTER,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import { DEFAULT_API_PAGE_SIZE, createApiError } from 'amo/api';
import { ErrorHandler } from 'amo/errorHandler';
import { createInternalAddon } from 'amo/reducers/addons';
import { searchStart } from 'amo/reducers/search';
import ErrorList from 'amo/components/ErrorList';
import {
  DEFAULT_LANG_IN_TESTS,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSearchResults,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let props;

  function render(extra = {}) {
    return shallow(<SearchBase {...{ ...props, ...extra }} />);
  }

  function renderWithStore(renderProps) {
    return shallowUntilTarget(
      <Search i18n={fakeI18n()} {...renderProps} />,
      SearchBase,
    );
  }

  beforeEach(() => {
    props = {
      context: VIEW_CONTEXT_HOME,
      count: 80,
      dispatch: sinon.stub(),
      errorHandler: createStubErrorHandler(),
      filters: { page: 3, query: 'foo' },
      pathname: '/search/',
      handleSearch: sinon.spy(),
      i18n: fakeI18n(),
      loading: false,
      pageSize: String(DEFAULT_API_PAGE_SIZE),
      results: [
        { name: 'Foo', slug: 'foo' },
        { name: 'Bar', slug: 'bar' },
      ],
    };
  });

  it('renders the results', () => {
    const count = 50;
    const addons = Array(count).fill(fakeAddon);
    const results = addons.map((addon) =>
      createInternalAddon(addon, DEFAULT_LANG_IN_TESTS),
    );
    const filters = { page: 3, query: 'foo' };
    const { store } = dispatchSearchResults({ addons });
    const root = renderWithStore({ filters, store });

    const searchResults = root.find(SearchResults);
    expect(searchResults.prop('count')).toEqual(Object.keys(addons).length);
    expect(searchResults.prop('filters')).toEqual(filters);
    expect(searchResults.prop('loading')).toEqual(false);
    expect(searchResults.prop('results')).toEqual(results);
    expect(Object.keys(searchResults.props()).sort()).toEqual(
      ['count', 'filters', 'loading', 'paginator', 'results'].sort(),
    );
    expect(root.find('meta[name="robots"]')).toHaveLength(0);
  });

  it('passes a Paginate component to the SearchResults component', () => {
    const count = 50;
    const addons = Array(count).fill(fakeAddon);
    const filters = { page: 3, query: 'foo' };
    const { store } = dispatchSearchResults({ addons });
    const root = renderWithStore({ filters, store });
    const paginator = shallow(root.find(SearchResults).prop('paginator'));

    expect(paginator.instance()).toBeInstanceOf(Paginate);
    expect(paginator.prop('count')).toEqual(count);
    expect(paginator.prop('currentPage')).toEqual(3);
    expect(paginator.prop('pathname')).toEqual('/search/');
    expect(paginator.prop('perPage')).toEqual(DEFAULT_API_PAGE_SIZE);
    expect(paginator.prop('queryParams')).toEqual({ page: 3, q: 'foo' });
  });

  it('does not pass a Paginate component to SearchResults when there is no search term', () => {
    const { store } = dispatchSearchResults({
      addons: [],
      filters: { query: null },
    });
    const root = renderWithStore({ store });
    expect(root.find(SearchResults).prop('paginator')).toEqual(null);
  });

  it('renders SearchFilters when there are filters and results', () => {
    const root = render();
    const sort = root.find(SearchFilters);

    expect(sort.prop('filters')).toEqual(props.filters);
    expect(sort.prop('pathname')).toEqual(props.pathname);
  });

  it('renders SearchFilters even when there are no results', () => {
    const { store } = dispatchSearchResults({ addons: [] });
    const root = renderWithStore({ store });

    expect(root.find(SearchFilters)).toHaveLength(1);
  });

  it('does not render SearchFilters when enableSearchFilters is false', () => {
    const root = render({ enableSearchFilters: false });

    expect(root.find(SearchFilters)).toHaveLength(0);
  });

  it('dispatches the search on mount', () => {
    render();

    sinon.assert.calledWith(
      props.dispatch,
      searchStart({
        errorHandlerId: props.errorHandler.id,
        filters: props.filters,
      }),
    );
  });

  it('does not dispatch on mount if filters/results are loaded', () => {
    render({ filtersUsedForResults: props.filters });

    sinon.assert.neverCalledWith(
      props.dispatch,
      searchStart({
        errorHandlerId: props.errorHandler.id,
        filters: props.filters,
      }),
    );
  });

  it('dispatches the search on props change', () => {
    const root = render();

    const newFilters = { query: 'I am a new query', page: '1' };
    root.setProps({ filters: newFilters });

    sinon.assert.calledWith(
      props.dispatch,
      searchStart({
        errorHandlerId: props.errorHandler.id,
        filters: newFilters,
      }),
    );
  });

  it('dispatches a search when filters become empty', () => {
    const root = render({ filters: { query: 'foo' } });

    root.setProps({ filters: {} });

    sinon.assert.calledWith(
      props.dispatch,
      searchStart({
        errorHandlerId: props.errorHandler.id,
        filters: {},
      }),
    );
  });

  it('sets the viewContext to the addonType if addonType exists', () => {
    const fakeDispatch = sinon.stub();
    const filters = { addonType: ADDON_TYPE_EXTENSION, query: 'test' };

    render({ count: 0, dispatch: fakeDispatch, filters });

    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
  });

  it('should render an error', () => {
    const errorHandler = createStubErrorHandler(
      new Error('example of an error'),
    );
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
    expect(root.find('meta[name="robots"]')).toHaveLength(0);
  });

  it('renders an HTML title', () => {
    const filters = {};
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Search results');
  });

  it('renders an HTML title for recommended extensions', () => {
    const filters = { addonType: ADDON_TYPE_EXTENSION, promoted: RECOMMENDED };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Recommended extensions');
  });

  it('renders an HTML title for recommended themes', () => {
    const filters = {
      addonType: ADDON_TYPE_STATIC_THEME,
      promoted: RECOMMENDED,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Recommended themes');
  });

  it('renders an HTML title for recommended add-ons', () => {
    const filters = { addonType: ADDON_TYPE_LANG, promoted: RECOMMENDED };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Recommended add-ons');
  });

  it('renders an HTML title for line extensions', () => {
    const filters = { addonType: ADDON_TYPE_EXTENSION, promoted: LINE };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Extensions by Firefox');
  });

  it('renders an HTML title for line themes', () => {
    const filters = {
      addonType: ADDON_TYPE_STATIC_THEME,
      promoted: LINE,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Themes by Firefox');
  });

  it('renders an HTML title for line add-ons', () => {
    const filters = { addonType: ADDON_TYPE_LANG, promoted: LINE };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Add-ons by Firefox');
  });

  it('renders an HTML title for reviewed extensions', () => {
    const filters = {
      addonType: ADDON_TYPE_EXTENSION,
      promoted: REVIEWED_FILTER,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Reviewed extensions');
  });

  it('renders an HTML title for reviewed themes', () => {
    const filters = {
      addonType: ADDON_TYPE_STATIC_THEME,
      promoted: REVIEWED_FILTER,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Reviewed themes');
  });

  it('renders an HTML title for reviewed add-ons', () => {
    const filters = { addonType: ADDON_TYPE_LANG, promoted: REVIEWED_FILTER };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Reviewed add-ons');
  });

  it('renders an HTML title for verified extensions', () => {
    const filters = {
      addonType: ADDON_TYPE_EXTENSION,
      promoted: VERIFIED_FILTER,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Verified extensions');
  });

  it('renders an HTML title for verified themes', () => {
    const filters = {
      addonType: ADDON_TYPE_STATIC_THEME,
      promoted: VERIFIED_FILTER,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Verified themes');
  });

  it('renders an HTML title for verified add-ons', () => {
    const filters = { addonType: ADDON_TYPE_LANG, promoted: VERIFIED_FILTER };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Verified add-ons');
  });

  it('renders an HTML title for trending extensions', () => {
    const filters = {
      addonType: ADDON_TYPE_EXTENSION,
      sort: SEARCH_SORT_TRENDING,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Trending extensions');
  });

  it('renders an HTML title for trending themes', () => {
    const filters = {
      addonType: ADDON_TYPE_STATIC_THEME,
      sort: SEARCH_SORT_TRENDING,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Trending themes');
  });

  it('renders an HTML title for trending add-ons', () => {
    const filters = {
      addonType: ADDON_TYPE_LANG,
      sort: SEARCH_SORT_TRENDING,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Trending add-ons');
  });

  it('renders an HTML title for top rated extensions', () => {
    const filters = {
      addonType: ADDON_TYPE_EXTENSION,
      sort: SEARCH_SORT_TOP_RATED,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Top rated extensions');
  });

  it('renders an HTML title for top rated themes', () => {
    const filters = {
      addonType: ADDON_TYPE_STATIC_THEME,
      sort: SEARCH_SORT_TOP_RATED,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Top rated themes');
  });

  it('renders an HTML title for top rated add-ons', () => {
    const filters = {
      addonType: ADDON_TYPE_LANG,
      sort: SEARCH_SORT_TOP_RATED,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Top rated add-ons');
  });

  it('renders an HTML title for popular extensions', () => {
    const filters = {
      addonType: ADDON_TYPE_EXTENSION,
      sort: SEARCH_SORT_POPULAR,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Popular extensions');
  });

  it('renders an HTML title for popular themes', () => {
    const filters = {
      addonType: ADDON_TYPE_STATIC_THEME,
      sort: SEARCH_SORT_POPULAR,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Popular themes');
  });

  it('renders an HTML title for popular add-ons', () => {
    const filters = {
      addonType: ADDON_TYPE_LANG,
      sort: SEARCH_SORT_POPULAR,
    };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Popular add-ons');
  });

  it('renders an HTML title for search query', () => {
    const filters = { query: 'some terms' };
    const wrapper = render({ filters });
    expect(wrapper.find('title')).toHaveText('Search results for "some terms"');
  });

  it('uses the pageTitle prop to override the built-in title', () => {
    const filters = { query: 'some terms' };
    const pageTitle = 'Some page title';
    const wrapper = render({ filters, pageTitle });
    expect(wrapper.find('title')).toHaveText(pageTitle);
  });

  it('sets the viewContext to exploring if viewContext has changed', () => {
    const { store } = dispatchClientMetadata();
    store.dispatch(setViewContext(ADDON_TYPE_EXTENSION));
    const fakeDispatch = sinon.stub(store, 'dispatch');

    renderWithStore({ store });

    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
  });

  it('does not set the viewContext if already set to exploring', () => {
    const fakeDispatch = sinon.stub();
    const filters = {};

    render({ context: ADDON_TYPE_EXTENSION, dispatch: fakeDispatch, filters });

    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
  });

  it.each([400, 404])('returns a Not Found page when error is %s', (status) => {
    const { store } = dispatchClientMetadata();

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(
      createApiError({
        response: { status },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'Nope.' },
      }),
    );

    const wrapper = renderWithStore({ ...props, errorHandler, store });
    expect(wrapper.find(NotFound)).toHaveLength(1);
  });

  it('renders a robots meta when there is no results', () => {
    const { store } = dispatchSearchResults({ addons: [] });
    const root = renderWithStore({ store });

    expect(root.find('meta[name="robots"]')).toHaveLength(1);
    expect(root.find('meta[name="robots"]')).toHaveProp(
      'content',
      'noindex, follow',
    );
  });

  it('does not render a robots meta when there are results', () => {
    const { store } = dispatchSearchResults({ addons: [fakeAddon] });
    const root = renderWithStore({ store });

    expect(root.find('meta[name="robots"]')).toHaveLength(0);
  });

  it.each([undefined, false, true, '0'])(
    'does not render a robots meta when count is %s',
    (count) => {
      // We shouldn't manually inject `count`.
      const root = render({ count });

      expect(root.find('meta[name="robots"]')).toHaveLength(0);
    },
  );

  describe('errorHandler - extractId', () => {
    it('generates a unique ID based on the page filter', () => {
      const ownProps = {
        ...props,
        filters: {
          ...props.filters,
          page: '123',
        },
      };

      expect(extractId(ownProps)).toEqual('123');
    });

    it('generates a unique ID even when there is no page filter', () => {
      const ownProps = {
        ...props,
        filters: {
          ...props.filters,
          page: undefined,
        },
      };

      expect(extractId(ownProps)).toEqual(undefined);
    });
  });
});
