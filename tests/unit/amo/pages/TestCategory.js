import * as React from 'react';

import { getLanding, loadLanding } from 'amo/actions/landing';
import { setViewContext } from 'amo/actions/viewContext';
import Category, { CategoryBase } from 'amo/pages/Category';
import CategoryHeader from 'amo/components/CategoryHeader';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { categoriesFetch, categoriesLoad } from 'core/actions/categories';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  ADDON_TYPE_THEMES_FILTER,
  CATEGORIES_FETCH,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { visibleAddonType } from 'core/utils';
import ErrorList from 'ui/components/ErrorList';
import {
  createStubErrorHandler,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createAddonsApiResult,
  dispatchClientMetadata,
  fakeAddon,
  fakeCategory,
  onLocationChanged,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  let errorHandler;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    }).store;
    errorHandler = createStubErrorHandler();
  });

  function _categoriesLoad(actionParams = {}) {
    store.dispatch(
      categoriesLoad({
        result: [fakeCategory],
        ...actionParams,
      }),
    );
  }

  function _getLanding(params = {}) {
    store.dispatch(
      getLanding({
        addonType: fakeCategory.type,
        category: fakeCategory.slug,
        errorHandlerId: errorHandler.id,
        ...params,
      }),
    );
  }

  function _loadLanding(params = {}) {
    store.dispatch(
      loadLanding({
        addonType: ADDON_TYPE_THEME,
        featured: createAddonsApiResult([
          { ...fakeAddon, name: 'Howdy', slug: 'howdy' },
          { ...fakeAddon, name: 'Howdy again', slug: 'howdy-again' },
        ]),
        highlyRated: createAddonsApiResult([
          { ...fakeAddon, name: 'High', slug: 'high' },
          { ...fakeAddon, name: 'High again', slug: 'high-again' },
        ]),
        trending: createAddonsApiResult([
          { ...fakeAddon, name: 'Pop', slug: 'pop' },
          { ...fakeAddon, name: 'Pop again', slug: 'pop-again' },
        ]),
        ...params,
      }),
    );
  }

  function renderProps(
    customProps = {},
    { autoDispatchCategories = true, paramOverrides = {} } = {},
  ) {
    if (autoDispatchCategories) {
      _categoriesLoad();
    }

    return {
      errorHandler,
      i18n: fakeI18n(),
      match: {
        params: {
          slug: fakeCategory.slug,
          visibleAddonType: visibleAddonType(fakeCategory.type),
          ...paramOverrides,
        },
      },
      store,
      ...customProps,
    };
  }

  function render(props = {}, options = {}) {
    return shallowUntilTarget(
      <Category {...renderProps(props, options)} />,
      CategoryBase,
    );
  }

  function _categoriesFetch(overrides = {}) {
    store.dispatch(
      categoriesFetch({
        errorHandlerId: errorHandler.id,
        ...overrides,
      }),
    );
  }

  it('outputs a category page', () => {
    const root = render();
    expect(root).toHaveClassName('Category');
  });

  it('should render an error', () => {
    const customErrorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    customErrorHandler.handle(new Error('an unexpected error'));

    const root = render({ errorHandler: customErrorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it(
    'fetches categories and landing data ' +
      'and sets a viewContext when not yet loaded',
    () => {
      const fakeDispatch = sinon.stub(store, 'dispatch');
      render({}, { autoDispatchCategories: false });

      sinon.assert.callCount(fakeDispatch, 3);
      sinon.assert.calledWithMatch(
        fakeDispatch,
        categoriesFetch({
          errorHandlerId: errorHandler.id,
        }),
      );
      sinon.assert.calledWith(fakeDispatch, setViewContext(fakeCategory.type));
      sinon.assert.calledWith(
        fakeDispatch,
        getLanding({
          addonType: fakeCategory.type,
          category: fakeCategory.slug,
          errorHandlerId: errorHandler.id,
        }),
      );
    },
  );

  it('does not fetch categories when already loaded', () => {
    _categoriesFetch();
    _categoriesLoad();
    _getLanding();
    _loadLanding();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({}, { autoDispatchCategories: false });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      sinon.match({ type: CATEGORIES_FETCH }),
    );
  });

  it('does not fetch categories when an empty set was loaded', () => {
    _categoriesLoad({ result: [] });

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({}, { autoDispatchCategories: false });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not fetch anything while already loading data', () => {
    _categoriesFetch();
    _getLanding();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({}, { autoDispatchCategories: false });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when nothing has changed', () => {
    _categoriesLoad();
    _getLanding();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({}, { autoDispatchCategories: false });

    // This will trigger the componentWillReceiveProps() method.
    root.setProps();

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when there is an error', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({}, { autoDispatchCategories: false });

    const customErrorHandler = root.instance().props.errorHandler;
    customErrorHandler.captureError(new Error('an unexpected error'));

    fakeDispatch.resetHistory();
    root.setProps({ errorHandler: customErrorHandler });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when visible addon type is invalid', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          visibleAddonType: 'invalid',
        },
      },
    );

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any action when category slug is invalid', () => {
    _categoriesFetch();
    _categoriesLoad();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          slug: 'invalid',
        },
      },
    );

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches getLanding when results are not loaded', () => {
    _categoriesFetch();
    _categoriesLoad();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({}, { autoDispatchCategories: false });

    sinon.assert.calledWith(
      fakeDispatch,
      getLanding({
        addonType: fakeCategory.type,
        category: fakeCategory.slug,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('dispatches getLanding when category changes', () => {
    const category = 'some-category-slug';

    _categoriesFetch();
    _categoriesLoad({
      result: [{ ...fakeCategory }, { ...fakeCategory, slug: category }],
    });
    _getLanding();
    _loadLanding();

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          slug: category,
        },
      },
    );

    sinon.assert.calledWith(
      fakeDispatch,
      getLanding({
        addonType: fakeCategory.type,
        category,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('dispatches getLanding when addonType changes', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const category = fakeCategory.slug;

    _categoriesFetch();
    _categoriesLoad({
      result: [{ ...fakeCategory }, { ...fakeCategory, type: addonType }],
    });
    _getLanding();
    _loadLanding();

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          visibleAddonType: visibleAddonType(addonType),
        },
      },
    );

    sinon.assert.calledWith(
      fakeDispatch,
      getLanding({
        addonType,
        category,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('passes a category to the header', () => {
    const root = render();

    expect(root.find(CategoryHeader)).toHaveProp('category', fakeCategory);
  });

  it('sets loading to true if categories are loading', () => {
    _categoriesFetch();

    const root = render({}, { autoDispatchCategories: false });
    expect(root.instance().props.loading).toEqual(true);
  });

  it('sets loading to true if landing data are loading', () => {
    _getLanding();

    const root = render({}, { autoDispatchCategories: false });
    expect(root.instance().props.loading).toEqual(true);
  });

  it('sets loading to false if nothing is loading', () => {
    const root = render({}, { autoDispatchCategories: false });
    expect(root.instance().props.loading).toEqual(false);
  });

  it('sets the correct header/footer texts and links for extensions', () => {
    _categoriesFetch();
    _categoriesLoad({
      result: [{ ...fakeCategory, type: ADDON_TYPE_EXTENSION }],
    });
    _getLanding();
    _loadLanding();

    const root = render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
        },
      },
    );

    const landingShelves = root.find(LandingAddonsCard);
    expect(landingShelves).toHaveLength(3);

    expect(landingShelves.at(0)).toHaveClassName('FeaturedAddons');
    expect(landingShelves.at(0)).toHaveProp('header', 'Featured extensions');
    expect(landingShelves.at(0)).toHaveProp(
      'footerText',
      'See more featured extensions',
    );
    expect(landingShelves.at(0)).toHaveProp('footerLink', {
      pathname: `/search/`,
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        category: fakeCategory.slug,
        featured: true,
      },
    });

    expect(landingShelves.at(1)).toHaveClassName('HighlyRatedAddons');
    expect(landingShelves.at(1)).toHaveProp('header', 'Top rated extensions');
    expect(landingShelves.at(1)).toHaveProp(
      'footerText',
      'See more top rated extensions',
    );
    expect(landingShelves.at(1)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        category: fakeCategory.slug,
        sort: SEARCH_SORT_TOP_RATED,
      },
    });

    expect(landingShelves.at(2)).toHaveClassName('TrendingAddons');
    expect(landingShelves.at(2)).toHaveProp('header', 'Trending extensions');
    expect(landingShelves.at(2)).toHaveProp(
      'footerText',
      'See more trending extensions',
    );
    expect(landingShelves.at(2)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        category: fakeCategory.slug,
        sort: SEARCH_SORT_TRENDING,
      },
    });
  });

  it('sets the correct footer links for themes', () => {
    _categoriesFetch();
    _categoriesLoad();
    _getLanding();
    _loadLanding();

    const root = render({ autoDispatchCategories: false });

    const landingShelves = root.find(LandingAddonsCard);

    expect(landingShelves.at(0)).toHaveProp('footerLink');
    expect(landingShelves.at(0).props().footerLink.query.addonType).toEqual(
      ADDON_TYPE_THEMES_FILTER,
    );

    expect(landingShelves.at(1)).toHaveProp('footerLink');
    expect(landingShelves.at(1).props().footerLink.query.addonType).toEqual(
      ADDON_TYPE_THEMES_FILTER,
    );

    expect(landingShelves.at(2)).toHaveProp('footerLink');
    expect(landingShelves.at(2).props().footerLink.query.addonType).toEqual(
      ADDON_TYPE_THEMES_FILTER,
    );
  });

  it('passes an isTheme prop as true to LandingAddonsCard if type is a theme', () => {
    _categoriesFetch();
    _categoriesLoad();
    _getLanding();
    _loadLanding();

    const root = render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
        },
      },
    );

    const landingShelves = root.find(LandingAddonsCard);

    expect.assertions(3);
    landingShelves.forEach((shelf) => {
      expect(shelf).toHaveProp('isTheme', true);
    });
  });

  it('renders a theme class name if type is a theme', () => {
    const root = render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
        },
      },
    );

    expect(root).toHaveClassName('Category--theme');
  });

  it('renders without a theme class name if type is an extension', () => {
    const root = render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
        },
      },
    );

    expect(root).not.toHaveClassName('Category--theme');
  });

  it('sets the correct header/footer texts and links for themes', () => {
    _categoriesFetch();
    _categoriesLoad();
    _getLanding();
    _loadLanding();

    const root = render({ autoDispatchCategories: false });

    const landingShelves = root.find(LandingAddonsCard);
    expect(landingShelves).toHaveLength(3);

    expect(landingShelves.at(0)).toHaveClassName('FeaturedAddons');
    expect(landingShelves.at(0)).toHaveProp('header', 'Featured themes');
    expect(landingShelves.at(0)).toHaveProp(
      'footerText',
      'See more featured themes',
    );
    expect(landingShelves.at(0)).toHaveProp('footerLink', {
      pathname: `/search/`,
      query: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        category: fakeCategory.slug,
        featured: true,
      },
    });

    expect(landingShelves.at(1)).toHaveClassName('HighlyRatedAddons');
    expect(landingShelves.at(1)).toHaveProp('header', 'Top rated themes');
    expect(landingShelves.at(1)).toHaveProp(
      'footerText',
      'See more top rated themes',
    );
    expect(landingShelves.at(1)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        category: fakeCategory.slug,
        sort: SEARCH_SORT_TOP_RATED,
      },
    });

    expect(landingShelves.at(2)).toHaveClassName('TrendingAddons');
    expect(landingShelves.at(2)).toHaveProp('header', 'Trending themes');
    expect(landingShelves.at(2)).toHaveProp(
      'footerText',
      'See more trending themes',
    );
    expect(landingShelves.at(2)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        category: fakeCategory.slug,
        sort: SEARCH_SORT_TRENDING,
      },
    });
  });

  it('hides the trending shelf when there are no add-ons for it', () => {
    _categoriesFetch();
    _categoriesLoad();
    _getLanding();
    _loadLanding({ trending: createAddonsApiResult([]) });

    const root = render({}, { autoDispatchCategories: false });
    const landingShelves = root.find(LandingAddonsCard);

    expect(root.find(LandingAddonsCard)).toHaveLength(2);
    expect(landingShelves.at(0)).toHaveClassName('FeaturedAddons');
    expect(landingShelves.at(1)).toHaveClassName('HighlyRatedAddons');
  });

  it('hides the featured shelf when there are no add-ons for it', () => {
    _categoriesFetch();
    _categoriesLoad();
    _getLanding();
    _loadLanding({ featured: createAddonsApiResult([]) });

    const root = render({}, { autoDispatchCategories: false });
    const landingShelves = root.find(LandingAddonsCard);

    expect(root.find(LandingAddonsCard)).toHaveLength(2);
    expect(landingShelves.at(0)).toHaveClassName('HighlyRatedAddons');
    expect(landingShelves.at(1)).toHaveClassName('TrendingAddons');
  });

  it('hides the highly rated shelf when there are no add-ons for it', () => {
    _categoriesFetch();
    _categoriesLoad();
    _getLanding();
    _loadLanding({ highlyRated: createAddonsApiResult([]) });

    const root = render({}, { autoDispatchCategories: false });
    const landingShelves = root.find(LandingAddonsCard);

    expect(root.find(LandingAddonsCard)).toHaveLength(2);
    expect(landingShelves.at(0)).toHaveClassName('FeaturedAddons');
    expect(landingShelves.at(1)).toHaveClassName('TrendingAddons');
  });

  it('renders an HTML title for a theme category', () => {
    const wrapper = render();
    expect(wrapper.find('title')).toHaveText('Testing category – Themes');
  });

  it('renders an HTML title for an extension category', () => {
    _categoriesFetch();
    _categoriesLoad({
      result: [{ ...fakeCategory, type: ADDON_TYPE_EXTENSION }],
    });
    _getLanding();
    _loadLanding();

    const wrapper = render(
      {},
      {
        autoDispatchCategories: false,
        paramOverrides: {
          visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
        },
      },
    );
    expect(wrapper.find('title')).toHaveText('Testing category – Extensions');
  });

  it('does not render an HTML title when there is no category', () => {
    const wrapper = render({}, { autoDispatchCategories: false });
    expect(wrapper.find('title')).toHaveLength(0);
  });

  describe('category lookup', () => {
    const decoyCategory = {
      ...fakeCategory,
      application: CLIENT_APP_FIREFOX,
      type: ADDON_TYPE_THEME,
      slug: 'decoy-slug',
    };
    const targetCategory = {
      ...fakeCategory,
      application: CLIENT_APP_ANDROID,
      type: ADDON_TYPE_EXTENSION,
      slug: 'target-slug',
    };

    const _dispatchClientApp = (clientApp) =>
      dispatchClientMetadata({
        store,
        clientApp,
      });

    function _render(
      props = {},
      { autoDispatchCategories = true, ...options } = {},
    ) {
      if (autoDispatchCategories) {
        _categoriesLoad({ result: [decoyCategory, targetCategory] });
      }
      return render(props, {
        // Since we loaded our own, tell the parent helper not to.
        autoDispatchCategories: false,
        ...options,
      });
    }

    it('looks for a category by slug, addonType, and clientApp', () => {
      _dispatchClientApp(targetCategory.application);

      const root = _render(
        {},
        {
          paramOverrides: {
            slug: targetCategory.slug,
            visibleAddonType: visibleAddonType(targetCategory.type),
          },
        },
      );

      expect(root.find(CategoryHeader)).toHaveProp('category', targetCategory);
    });

    it('renders a 404 for unknown category', () => {
      const root = _render(
        {},
        {
          paramOverrides: { slug: 'unknown-category' },
        },
      );

      expect(root.find(NotFound)).toHaveLength(1);
    });

    it('renders 404 for mismatched clientApp', () => {
      _dispatchClientApp(decoyCategory.application);

      const root = _render({
        params: {
          slug: targetCategory.slug,
          visibleAddonType: visibleAddonType(targetCategory.type),
        },
      });

      expect(root.find(NotFound)).toHaveLength(1);
    });

    it('renders 404 for mismatched addonType', () => {
      _dispatchClientApp(targetCategory.application);

      const root = _render({
        params: {
          slug: targetCategory.slug,
          visibleAddonType: visibleAddonType(decoyCategory.type),
        },
      });

      expect(root.find(NotFound)).toHaveLength(1);
    });

    it('renders 404 for bogus addonType', () => {
      _dispatchClientApp(targetCategory.application);

      const root = _render({
        params: {
          slug: targetCategory.slug,
          visibleAddonType: 'bogus-addon-type',
        },
      });

      expect(root.find(NotFound)).toHaveLength(1);
    });

    it('renders 404 for bogus clientApp', () => {
      _dispatchClientApp('not-a-valid-client-app');

      const root = _render({
        params: {
          slug: targetCategory.slug,
          visibleAddonType: visibleAddonType(targetCategory.type),
        },
      });

      expect(root.find(NotFound)).toHaveLength(1);
    });

    it('does not render missing category 404 when error is present', () => {
      const root = _render(
        {},
        {
          paramOverrides: { slug: 'unknown-category' },
        },
      );
      root.setProps({
        errorHandler: createStubErrorHandler(new Error('example')),
      });

      expect(root.find(NotFound)).toHaveLength(0);
    });

    it('does not render missing category 404 while loading', () => {
      _categoriesFetch();
      const root = _render(
        {},
        {
          autoDispatchCategories: false,
          paramOverrides: { slug: 'unknown-category' },
        },
      );

      expect(root.find(NotFound)).toHaveLength(0);
      // Make sure the header is still rendered.
      expect(root.find(CategoryHeader)).toHaveProp('category', undefined);
    });

    it('does not render missing category 404 before loading categories', () => {
      const root = _render(
        {},
        {
          autoDispatchCategories: false,
          paramOverrides: { slug: 'unknown-category' },
        },
      );

      expect(root.find(NotFound)).toHaveLength(0);
    });
  });

  it('renders a canonical link tag', () => {
    const baseURL = 'https://example.org';
    const _config = getFakeConfig({ baseURL });

    const pathname = '/some-category-pathname/';
    store.dispatch(onLocationChanged({ pathname }));

    const root = render({ _config });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp(
      'href',
      `${baseURL}${pathname}`,
    );
  });
});
