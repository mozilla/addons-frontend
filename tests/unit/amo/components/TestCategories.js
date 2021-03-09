import { shallow } from 'enzyme';
import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import {
  CategoriesBase,
  categoryResultsLinkTo,
  mapStateToProps,
} from 'amo/components/Categories';
import { fetchCategories, loadCategories } from 'amo/reducers/categories';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
} from 'amo/constants';
import { getCategoryResultsQuery } from 'amo/utils/categories';
import Button from 'amo/components/Button';
import LoadingText from 'amo/components/LoadingText';
import {
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeCategory,
  fakeI18n,
} from 'tests/unit/helpers';
import ErrorList from 'amo/components/ErrorList';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render({ ...props } = {}) {
    const errorHandler = createStubErrorHandler();

    return shallow(
      <CategoriesBase
        addonType={ADDON_TYPE_EXTENSION}
        dispatch={store.dispatch}
        errorHandler={errorHandler}
        i18n={fakeI18n()}
        {...mapStateToProps(store.getState())}
        {...props}
      />,
    );
  }

  it('fetches categories if needed', () => {
    const dispatch = sinon.stub();
    const errorHandler = createStubErrorHandler();
    render({
      addonType: ADDON_TYPE_EXTENSION,
      dispatch,
      errorHandler,
    });

    sinon.assert.calledWith(
      dispatch,
      fetchCategories({
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('does not fetch categories if already loading them', () => {
    store.dispatch(
      fetchCategories({
        errorHandlerId: createStubErrorHandler().id,
      }),
    );
    const dispatch = sinon.stub();
    render({ addonType: ADDON_TYPE_EXTENSION, dispatch });

    // Make sure only the viewContext was dispatched, not a fetch action.
    sinon.assert.calledWith(dispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.calledOnce(dispatch);
  });

  it('does not fetch categories if already loaded', () => {
    store.dispatch(loadCategories({ results: [fakeCategory] }));
    const dispatch = sinon.stub();
    render({ addonType: ADDON_TYPE_EXTENSION, dispatch });

    // Make sure only the viewContext was dispatched, not a fetch action.
    sinon.assert.calledWith(dispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.calledOnce(dispatch);
  });

  it('does not fetch categories if an empty set was loaded', () => {
    store.dispatch(loadCategories({ results: [] }));
    const dispatch = sinon.stub();
    render({ addonType: ADDON_TYPE_EXTENSION, dispatch });

    // Make sure only the viewContext was dispatched, not a fetch action.
    sinon.assert.calledWith(dispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.calledOnce(dispatch);
  });

  it('changes viewContext if addonType changes', () => {
    const dispatch = sinon.stub();
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      dispatch,
    });

    root.setProps({ addonType: ADDON_TYPE_STATIC_THEME });

    sinon.assert.calledWith(dispatch, setViewContext(ADDON_TYPE_STATIC_THEME));
  });

  it('does not dispatch setViewContext if addonType does not change', () => {
    const dispatch = sinon.stub();
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      dispatch,
    });

    sinon.assert.calledWith(dispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.calledTwice(dispatch);

    dispatch.resetHistory();
    root.setProps();

    // Dispatch should not be called again because no new props were set.
    sinon.assert.notCalled(dispatch);
  });

  it('renders Categories', () => {
    const root = render({ addonType: ADDON_TYPE_EXTENSION });

    expect(root).toHaveClassName('Categories');
  });

  it('renders loading text when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      loading: true,
    });

    expect(root.find('.Categories-loading-info')).toIncludeText(
      'Loading categories.',
    );
  });

  it('renders LoadingText components when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      loading: true,
    });

    expect(
      root.find('.Categories-loading-text').find(LoadingText),
    ).toHaveLength(8);
  });

  it('renders categories if they exist', () => {
    const categoriesResponse = {
      results: [
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Travel',
          slug: 'Travel',
          type: ADDON_TYPE_EXTENSION,
        },
      ],
    };

    store.dispatch(loadCategories(categoriesResponse));

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
    });

    expect(root.find('.Categories-list').childAt(0).find(Button)).toHaveProp(
      'children',
      'Games',
    );
    expect(root.find('.Categories-list').childAt(1).find(Button)).toHaveProp(
      'children',
      'Travel',
    );
  });

  it('generates an expected link for a category', () => {
    const slug = 'games';
    const type = ADDON_TYPE_EXTENSION;
    const categoriesResponse = {
      results: [
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          slug,
          type,
        },
      ],
    };

    store.dispatch(loadCategories(categoriesResponse));

    const root = render({
      addonType: type,
    });

    expect(root.find(Button).prop('to')).toEqual(
      categoryResultsLinkTo({ addonType: type, slug }),
    );
  });

  it('sorts and renders the sorted categories', () => {
    const categoriesResponse = {
      results: [
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Travel',
          slug: 'travel',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Music',
          slug: 'music',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Nature',
          slug: 'nature',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
      ],
    };

    store.dispatch(loadCategories(categoriesResponse));

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
    });

    expect(root.find('.Categories-list').childAt(0).find(Button)).toHaveProp(
      'children',
      'Games',
    );
    expect(root.find('.Categories-list').childAt(1).find(Button)).toHaveProp(
      'children',
      'Music',
    );
    expect(root.find('.Categories-list').childAt(2).find(Button)).toHaveProp(
      'children',
      'Nature',
    );
    expect(root.find('.Categories-list').childAt(3).find(Button)).toHaveProp(
      'children',
      'Travel',
    );
  });

  it('renders a no categories found message', () => {
    const categoriesResponse = { results: [] };
    store.dispatch(loadCategories(categoriesResponse));
    const root = render();

    expect(root.find('.Categories-none-loaded-message')).toIncludeText(
      'No categories found.',
    );
  });

  it('reports errors', () => {
    const errorHandler = createStubErrorHandler(
      new Error('example of an error'),
    );
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('renders a class name with a color for each category', () => {
    const categoriesResponse = {
      // Generate 13 categories.
      results: Array(13)
        .fill()
        .map((_, index) => ({
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          id: index,
          name: `category ${index}`,
          slug: `category-${index}`,
          type: ADDON_TYPE_EXTENSION,
        })),
    };
    store.dispatch(loadCategories(categoriesResponse));

    const root = render();

    expect(root.find('.Categories-link')).toHaveLength(13);
    // The first `color-1` should be set on the 1st category.
    expect(root.find('.Categories-link').at(0)).toHaveClassName(
      'Categories--category-color-1',
    );
    // The `color-12` should be set on the 12th category.
    expect(root.find('.Categories-link').at(11)).toHaveClassName(
      'Categories--category-color-12',
    );
    // The second `color-1` should be set on the 13th category.
    expect(root.find('.Categories-link').at(12)).toHaveClassName(
      'Categories--category-color-1',
    );
  });

  describe('categoryResultsLinkTo', () => {
    it('returns a "to" object', () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const slug = 'some-slug';

      const toValue = categoryResultsLinkTo({ addonType, slug });
      expect(toValue.pathname).toEqual('/search/');
      expect(toValue.query).toEqual(
        getCategoryResultsQuery({ addonType, slug }),
      );
    });
  });
});
