import { shallow } from 'enzyme';
import React from 'react';

import { CategoryBase, mapStateToProps } from 'amo/components/Category';
import CategoryHeader from 'amo/components/CategoryHeader';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Search from 'amo/components/Search';
import { categoriesFetch, categoriesLoad } from 'core/actions/categories';
import { searchStart } from 'core/actions/search';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import { visibleAddonType } from 'core/utils';
import { createStubErrorHandler, getFakeI18nInst } from 'tests/unit/helpers';
import { dispatchClientMetadata, fakeCategory } from 'tests/unit/amo/helpers';
import ErrorList from 'ui/components/ErrorList';


describe('Category', () => {
  let errorHandler;
  let store;

  beforeEach(() => {
    const clientData = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    });
    errorHandler = createStubErrorHandler();
    store = clientData.store;
  });

  function _categoriesLoad(actionParams = {}) {
    store.dispatch(categoriesLoad({
      result: [fakeCategory],
      ...actionParams,
    }));
  }

  function renderProps(
    customProps = {},
    {
      autoDispatchCategories = true,
      paramOverrides = {},
    } = {}
  ) {
    if (autoDispatchCategories) {
      _categoriesLoad();
    }
    const state = store.getState();

    // TODO: move to shallowUntilTarget
    return {
      ...mapStateToProps(state),
      dispatch: store.dispatch,
      errorHandler,
      i18n: getFakeI18nInst(),
      location: { query: {} },
      params: {
        slug: fakeCategory.slug,
        visibleAddonType: visibleAddonType(fakeCategory.type),
        ...paramOverrides,
      },
      ...customProps,
    };
  }

  function render(props = {}, options = {}) {
    return shallow(<CategoryBase {...renderProps(props, options)} />);
  }

  function _categoriesFetch(overrides = {}) {
    store.dispatch(categoriesFetch({
      errorHandlerId: errorHandler.id,
      ...overrides,
    }));
  }

  it('outputs a category page', () => {
    const root = render();

    expect(root).toHaveClassName('Category');
  });

  it('should render an error', () => {
    const root = render();
    root.setProps({
      errorHandler: createStubErrorHandler(
        new Error('example of an error')
      ),
    });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('should render an error without a category too', () => {
    const root = render({}, {
      paramOverrides: { slug: 'unknown-category' },
    });
    root.setProps({
      errorHandler: createStubErrorHandler(new Error('example')),
    });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('configures a Search component', () => {
    const location = { query: { page: 2 } };
    const params = {
      slug: fakeCategory.slug,
      visibleAddonType: visibleAddonType(fakeCategory.type),
    };
    const root = render({ location, params });
    const search = root.find(Search);

    expect(search).toHaveProp('filters', {
      addonType: fakeCategory.type,
      category: fakeCategory.slug,
      page: location.query.page,
    });
    expect(search).toHaveProp('paginationQueryParams', {
      page: location.query.page,
    });
    expect(search).toHaveProp('pathname',
      `/${params.visibleAddonType}/${fakeCategory.slug}/`);
    expect(search).toHaveProp('enableSearchSort', false);
  });

  it('fetches categories when not yet loaded', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({}, { autoDispatchCategories: false });

    sinon.assert.calledWithMatch(fakeDispatch, categoriesFetch({
      errorHandlerId: errorHandler.id,
    }));
  });

  it('does not fetch categories when already loaded', () => {
    _categoriesLoad();
    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({}, { autoDispatchCategories: false });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not fetch categories while already loading them', () => {
    _categoriesFetch();
    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({}, { autoDispatchCategories: false });

    sinon.assert.notCalled(fakeDispatch);
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

  it('sets loading to false if nothing is loading', () => {
    const root = render({}, { autoDispatchCategories: false });

    expect(root.instance().props.loading).toEqual(false);
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

    const _dispatchClientApp = (clientApp) => dispatchClientMetadata({
      store, clientApp,
    });

    function _render(
      props = {}, { autoDispatchCategories = true, ...options } = {}
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

      const root = _render({
        params: {
          slug: targetCategory.slug,
          visibleAddonType: visibleAddonType(targetCategory.type),
        },
      });

      expect(root.find(CategoryHeader))
        .toHaveProp('category', targetCategory);
    });

    it('renders a 404 for unknown category', () => {
      const root = _render({}, {
        paramOverrides: { slug: 'unknown-category' },
      });

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
      const root = _render({}, {
        paramOverrides: { slug: 'unknown-category' },
      });
      root.setProps({
        errorHandler: createStubErrorHandler(new Error('example')),
      });

      expect(root.find(NotFound)).toHaveLength(0);
    });

    it('does not render missing category 404 while loading', () => {
      _categoriesFetch();
      const root = _render({}, {
        autoDispatchCategories: false,
        paramOverrides: { slug: 'unknown-category' },
      });

      expect(root.find(NotFound)).toHaveLength(0);
      // Make sure the header is still rendered.
      expect(root.find(CategoryHeader)).toHaveProp('category', undefined);
    });

    it('does not render missing category 404 before loading categories', () => {
      const root = _render({}, {
        autoDispatchCategories: false,
        paramOverrides: { slug: 'unknown-category' },
      });

      expect(root.find(NotFound)).toHaveLength(0);
    });
  });
});
