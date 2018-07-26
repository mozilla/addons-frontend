import * as React from 'react';
import { shallow } from 'enzyme';

import AddonsByAuthorsCard, {
  AddonsByAuthorsCardBase,
} from 'amo/components/AddonsByAuthorsCard';
import AddonsCard from 'amo/components/AddonsCard';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  THEMES_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { createApiError } from 'core/api';
import { ErrorHandler } from 'core/errorHandler';
import Paginate from 'core/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import ErrorList from 'ui/components/ErrorList';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeAuthor,
} from 'tests/unit/amo/helpers';
import {
  createContextWithFakeRouter,
  createStubErrorHandler,
  fakeI18n,
  fakeRouterLocation,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const fakeAuthorOne = {
    ...fakeAuthor,
    name: 'Krupa',
    username: 'krupa',
    id: 51,
  };
  const fakeAuthorTwo = {
    ...fakeAuthor,
    name: 'Matt',
    username: 'tofumatt',
    id: 61,
  };
  const fakeAuthorThree = {
    ...fakeAuthor,
    name: 'Fligtar',
    username: 'fligtar',
    id: 71,
  };

  function fakeAddons() {
    const firstAddon = {
      ...fakeAddon,
      id: 6,
      slug: 'first',
      authors: [fakeAuthorOne, fakeAuthorTwo],
    };
    const secondAddon = {
      ...fakeAddon,
      id: 7,
      slug: 'second',
      authors: [fakeAuthorTwo],
    };
    const thirdAddon = {
      ...fakeAddon,
      id: 8,
      slug: 'third',
      authors: [fakeAuthorThree],
    };

    return { firstAddon, secondAddon, thirdAddon };
  }

  function fakeAuthorUsernames() {
    return [
      fakeAuthorOne.username,
      fakeAuthorTwo.username,
      fakeAuthorThree.username,
    ];
  }

  function addonsWithAuthorsOfType({
    addonType,
    multipleAuthors = false,
    count = null,
  }) {
    const pageSize =
      addonType === ADDON_TYPE_THEME
        ? THEMES_BY_AUTHORS_PAGE_SIZE
        : EXTENSIONS_BY_AUTHORS_PAGE_SIZE;

    const addons = [];
    const totalAddons = typeof count === 'number' ? count : pageSize;

    for (let i = 0; i < totalAddons; i++) {
      addons.push({
        ...fakeAddon,
        id: i + 1,
        slug: `foo${i}`,
        type: addonType,
        authors: [fakeAuthorOne],
      });
    }

    return loadAddonsByAuthors({
      addons,
      addonType,
      authorUsernames: multipleAuthors
        ? [fakeAuthorOne.username, fakeAuthorTwo.username]
        : [fakeAuthorOne.username],
      count: addons.length,
      pageSize,
    });
  }

  function render({ location, ...customProps } = {}) {
    const props = {
      authorDisplayName: fakeAuthorOne.name,
      i18n: fakeI18n(),
      numberOfAddons: 4,
      store: dispatchClientMetadata().store,
      ...customProps,
    };

    return shallowUntilTarget(
      <AddonsByAuthorsCard {...props} />,
      AddonsByAuthorsCardBase,
      {
        shallowOptions: createContextWithFakeRouter({ location }),
      },
    );
  }

  function renderAddonsWithType({
    addonType,
    showMore,
    multipleAuthors = false,
    numberOfAddons = 6,
    count = null,
    ...otherProps
  } = {}) {
    const authorUsernames = multipleAuthors
      ? [fakeAuthorOne.username, fakeAuthorTwo.username]
      : [fakeAuthorOne.username];
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();

    store.dispatch(
      addonsWithAuthorsOfType({
        addonType,
        count,
        multipleAuthors,
      }),
    );

    return render({
      addonType,
      showMore,
      authorUsernames,
      errorHandler,
      numberOfAddons,
      store,
      ...otherProps,
    });
  }

  it('should render a card', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = fakeAuthorUsernames();
    const addons = Object.values(fakeAddons()).sort();

    store.dispatch(
      loadAddonsByAuthors({
        addons,
        authorUsernames,
        count: addons.length,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      }),
    );

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames,
      numberOfAddons: 4,
      store,
    });

    // The sort of the add-ons in the reducer isn't set, so we just make sure
    // to sort the add-ons here because the order isn't guaranteed.
    function sortAddons(addonsArray) {
      return addonsArray.sort((a, b) => {
        return a.id > b.id;
      });
    }

    expect(root).toHaveClassName('AddonsByAuthorsCard');
    expect(sortAddons(root.find(AddonsCard).prop('addons'))).toEqual(
      sortAddons(addons).map(createInternalAddon),
    );
    expect(root.find(AddonsCard)).toHaveProp(
      'placeholderCount',
      root.instance().props.numberOfAddons,
    );
    expect(root.find(AddonsCard)).toHaveProp('showSummary', false);
    expect(root.find(AddonsCard)).toHaveProp('type', 'horizontal');
  });

  it('should render a className', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = fakeAuthorUsernames();
    const addons = Object.values(fakeAddons());

    store.dispatch(
      loadAddonsByAuthors({
        addons,
        authorUsernames,
        count: addons.length,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      }),
    );

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames,
      className: 'foo',
      store,
    });

    expect(root).toHaveClassName('foo');
  });

  it('should render nothing if there are no add-ons', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = fakeAuthorUsernames();
    store.dispatch(
      loadAddonsByAuthors({
        addons: [],
        authorUsernames,
        count: 0,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      }),
    );

    const root = render({ authorUsernames, store });

    expect(root).not.toHaveClassName('AddonsByAuthorsCard');
    expect(root.html()).toBeNull();
  });

  it('should render nothing if add-ons are null', () => {
    const root = render({
      addons: null,
      authorUsernames: ['test2'],
    });

    expect(root).not.toHaveClassName('AddonsByAuthorsCard');
    expect(root.html()).toBeNull();
  });

  it('should render a card with loading state if loading', () => {
    const { store } = dispatchClientMetadata();
    const errorHandler = createStubErrorHandler();
    store.dispatch(
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      }),
    );

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    expect(root).toHaveProp('loading', true);
    expect(root).toHaveClassName('AddonsByAuthorsCard');
  });

  // We want to always make sure to do a fetch to make sure
  // we have the latest addons list.
  // See: https://github.com/mozilla/addons-frontend/issues/4852
  it('should always fetch addons by authors', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const numberOfAddons = 4;

    render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      numberOfAddons,
      store,
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        pageSize: numberOfAddons,
      }),
    );
  });

  it('should dispatch a fetch action if authorUsernames are updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const numberOfAddons = 4;

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      numberOfAddons,
      store,
    });

    dispatchSpy.resetHistory();

    root.setProps({
      addonType: ADDON_TYPE_THEME,
      authorUsernames: ['test1'],
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_THEME,
        authorUsernames: ['test1'],
        errorHandlerId: errorHandler.id,
        pageSize: numberOfAddons,
      }),
    );

    // Make sure an authorUsernames update even with the same addonType
    // dispatches a fetch action.
    dispatchSpy.resetHistory();

    root.setProps({
      addonType: ADDON_TYPE_THEME,
      authorUsernames: ['test2'],
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_THEME,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        pageSize: numberOfAddons,
      }),
    );
  });

  it('should dispatch a fetch action if addonType is updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const numberOfAddons = 6;

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      numberOfAddons,
      store,
    });

    dispatchSpy.resetHistory();

    root.setProps({
      addonType: ADDON_TYPE_OPENSEARCH,
      authorUsernames: ['test2'],
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_OPENSEARCH,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        pageSize: numberOfAddons,
      }),
    );
  });

  it('should dispatch a fetch action if forAddonSlug is updated', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const numberOfAddons = 4;

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      numberOfAddons,
      store,
    });

    dispatchSpy.resetHistory();

    root.setProps({
      forAddonSlug: 'testing',
    });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonsByAuthors({
        addonType: ADDON_TYPE_EXTENSION,
        authorUsernames: ['test2'],
        errorHandlerId: errorHandler.id,
        forAddonSlug: 'testing',
        pageSize: numberOfAddons,
      }),
    );
  });

  it('should not dispatch a fetch action if props are not changed', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
      errorHandler,
      store,
    });

    dispatchSpy.resetHistory();

    root.setProps({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames: ['test2'],
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('should display at most numberOfAddons extensions', () => {
    const numberOfAddons = 4;
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: false,
      numberOfAddons,
    });

    expect(root.find(AddonsCard).props().addons).toHaveLength(numberOfAddons);
  });

  it('should display at most numberOfAddons themes', () => {
    const numberOfAddons = 3;
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: false,
      numberOfAddons,
    });

    expect(root.find(AddonsCard).props().addons).toHaveLength(numberOfAddons);
  });

  it('should add a theme class if it is a lightweight theme', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
    });

    expect(root).toHaveClassName('AddonsByAuthorsCard--theme');
  });

  it('should add a theme class if it is a static theme', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
    });

    expect(root).toHaveClassName('AddonsByAuthorsCard--theme');
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More dictionaries by ${fakeAuthor.name}`,
    );
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Dictionaries by ${fakeAuthor.name}`,
    );
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More dictionaries by these translators',
    );
  });

  it('shows dictionaries in header for ADDON_TYPE_DICT with multiple authors and without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_DICT,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Dictionaries by these translators`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More extensions by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Extensions by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More extensions by these developers',
    );
  });

  it('shows extensions in header for ADDON_TYPE_EXTENSION with multiple authors and without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_EXTENSION,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Extensions by these developers',
    );
  });

  it('shows extensions in header for ADDON_TYPE_LANG', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More language packs by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_LANG without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Language packs by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for ADDON_TYPE_LANG with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More language packs by these translators',
    );
  });

  it('shows extensions in header for ADDON_TYPE_LANG with multiple authors and without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_LANG,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Language packs by these translators',
    );
  });

  it('shows extensions in header for a lightweight theme', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More themes by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for a static theme', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More themes by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for a lightweight theme without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Themes by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for a static theme without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Themes by ${fakeAuthor.name}`,
    );
  });

  it('shows extensions in header for a lightweight theme with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More themes by these artists',
    );
  });

  it('shows extensions in header for a static theme with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More themes by these artists',
    );
  });

  it('shows extensions in header for a lightweight theme with multiple authors and without More text ', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_THEME,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Themes by these artists',
    );
  });

  it('shows extensions in header for a static theme with multiple authors and without More text ', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_STATIC_THEME,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Themes by these artists',
    );
  });

  it('shows add-ons in header if no specific addonType translation found', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `More add-ons by ${fakeAuthor.name}`,
    );
  });

  it('shows add-ons in header if no specific addonType translation found without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      showMore: false,
      multipleAuthors: false,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      `Add-ons by ${fakeAuthor.name}`,
    );
  });

  it('shows add-ons in header if no specific addonType found with multiple authors', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'More add-ons by these developers',
    );
  });

  it('shows add-ons in header if no specific addonType found with multiple authors and without More text', () => {
    const root = renderAddonsWithType({
      addonType: ADDON_TYPE_OPENSEARCH,
      showMore: false,
      multipleAuthors: true,
    });

    expect(root.find(AddonsCard)).toHaveProp(
      'header',
      'Add-ons by these developers',
    );
  });

  describe('with pagination', () => {
    const renderWithPagination = (props) =>
      renderAddonsWithType({
        paginate: true,
        pathname: '/some/link',
        ...props,
      });

    it('shows a paginator when `count` is greater than the number of add-ons to display', () => {
      const count = 4;
      const location = fakeRouterLocation();
      const numberOfAddons = 1;
      const pathname = '/some/pathname';

      const root = renderWithPagination({
        count,
        location,
        numberOfAddons,
        pathname,
      });

      const paginator = shallow(root.find(AddonsCard).prop('footer'));

      expect(paginator.instance()).toBeInstanceOf(Paginate);
      expect(paginator).toHaveProp('count', count);
      expect(paginator).toHaveProp('currentPage', 1);
      expect(paginator).toHaveProp('pageParam', 'page');
      expect(paginator).toHaveProp('pathname', pathname);
      expect(paginator).toHaveProp('perPage', numberOfAddons);
      expect(paginator).toHaveProp('queryParams', location.query);
    });

    it('does not show a paginator when `count` is less than the number of add-ons to display', () => {
      const root = renderWithPagination({
        count: 4,
        numberOfAddons: 10,
      });

      expect(root.find(AddonsCard).prop('footer')).toEqual(null);
    });

    it('passes all the query parameters to the Paginate component', () => {
      const location = fakeRouterLocation({
        query: {
          page: 2,
          other: 'param',
        },
      });

      const root = renderWithPagination({ location });

      expect(shallow(root.find(AddonsCard).prop('footer'))).toHaveProp(
        'currentPage',
        2,
      );
      expect(shallow(root.find(AddonsCard).prop('footer'))).toHaveProp(
        'queryParams',
        location.query,
      );
    });

    it('sets the current page based on the `pageParam`', () => {
      const pageParam = 'my-page-parameter';
      const location = fakeRouterLocation({
        query: { [pageParam]: 123 },
      });

      const root = renderWithPagination({ location, pageParam });

      expect(shallow(root.find(AddonsCard).prop('footer'))).toHaveProp(
        'currentPage',
        123,
      );
    });

    it('sets the current page to 1 when there is no query parameter', () => {
      const location = fakeRouterLocation({
        query: {},
      });

      const root = renderWithPagination({ location });

      expect(shallow(root.find(AddonsCard).prop('footer'))).toHaveProp(
        'currentPage',
        1,
      );
    });

    it('sets the current page to 1 when query parameter has an incorrect value', () => {
      const location = fakeRouterLocation({
        query: { page: 'invalid' },
      });

      const root = renderWithPagination({ location });

      expect(shallow(root.find(AddonsCard).prop('footer'))).toHaveProp(
        'currentPage',
        1,
      );
    });

    it('sets the current page to 1 when query parameter has a negative value', () => {
      const location = fakeRouterLocation({
        query: { page: -11 },
      });

      const root = renderWithPagination({ location });

      expect(shallow(root.find(AddonsCard).prop('footer'))).toHaveProp(
        'currentPage',
        1,
      );
    });

    it('should dispatch a fetch action with `page` and `sort` parameters', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      const authorUsernames = ['test2'];
      const numberOfAddons = 4;

      renderWithPagination({
        addonType: ADDON_TYPE_EXTENSION,
        authorUsernames,
        errorHandler,
        numberOfAddons,
        store,
      });

      sinon.assert.calledWith(
        dispatchSpy,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorUsernames,
          errorHandlerId: errorHandler.id,
          page: 1,
          pageSize: numberOfAddons,
          sort: SEARCH_SORT_POPULAR,
        }),
      );
    });

    it('should dispatch a fetch action if page changes', () => {
      const { store } = dispatchClientMetadata();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      const authorUsernames = ['test2'];
      const numberOfAddons = 4;
      const location = fakeRouterLocation({ query: { page: 1 } });

      const root = renderWithPagination({
        addonType: ADDON_TYPE_EXTENSION,
        authorUsernames,
        errorHandler,
        location,
        numberOfAddons,
        store,
      });

      dispatchSpy.resetHistory();

      const newPage = 2;
      root.setProps({
        location: fakeRouterLocation({ query: { page: newPage } }),
      });

      sinon.assert.calledWith(
        dispatchSpy,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorUsernames,
          errorHandlerId: errorHandler.id,
          page: newPage,
          pageSize: numberOfAddons,
          sort: SEARCH_SORT_POPULAR,
        }),
      );
    });
  });

  it('renders an error when an API error is thrown', () => {
    const { store } = dispatchClientMetadata();
    const authorUsernames = ['some', 'authors'];

    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(
      createApiError({
        response: { status: 404 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'not found' },
      }),
    );

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      authorUsernames,
      errorHandler,
      store,
    });

    expect(root.find(ErrorList)).toHaveLength(1);
  });
});
