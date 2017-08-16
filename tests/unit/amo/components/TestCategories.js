import { shallow } from 'enzyme';
import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import { CategoriesBase, mapStateToProps } from 'amo/components/Categories';
import { categoriesFetch, categoriesLoad } from 'core/actions/categories';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import Button from 'ui/components/Button';
import LoadingText from 'ui/components/LoadingText';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { createStubErrorHandler, getFakeI18nInst } from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';


describe('<Categories />', () => {
  function render({ ...props }) {
    const fakeDispatch = sinon.stub();
    const errorHandler = createStubErrorHandler();

    return shallow(
      <CategoriesBase
        addonType={ADDON_TYPE_EXTENSION}
        dispatch={fakeDispatch}
        errorHandler={errorHandler}
        i18n={getFakeI18nInst()}
        {...props}
      />
    );
  }

  it('fetches categories if needed', () => {
    const dispatch = sinon.stub();
    const errorHandler = new ErrorHandler({
      id: 'custom-error-handler',
      dispatch,
    });
    render({
      addonType: ADDON_TYPE_EXTENSION, categories: {}, dispatch, errorHandler,
    });

    sinon.assert.calledWith(dispatch, categoriesFetch({
      errorHandlerId: errorHandler.id,
    }));
  });

  it('changes viewContext if addonType changes', () => {
    const dispatch = sinon.stub();
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      dispatch,
    });

    root.setProps({ addonType: ADDON_TYPE_THEME });

    sinon.assert.calledWith(dispatch, setViewContext(ADDON_TYPE_THEME));
  });

  it('does not dispatch setViewContext if addonType does not change', () => {
    const dispatch = sinon.stub();
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      dispatch,
    });

    sinon.assert.calledWith(dispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.calledTwice(dispatch);

    dispatch.reset();
    root.setProps();

    // Dispatch should not be called again because no new props were set.
    sinon.assert.notCalled(dispatch);
  });

  it('renders Categories', () => {
    const root = render({ addonType: ADDON_TYPE_EXTENSION, categories: {} });

    expect(root).toHaveClassName('Categories');
  });

  it('renders loading text when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      loading: true,
    });

    expect(root.find('.Categories-loading-info'))
      .toIncludeText('Loading categories.');
  });

  it('renders LoadingText components when loading', () => {
    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories: {},
      loading: true,
    });

    expect(root.find('.Categories-loading-text').find(LoadingText))
      .toHaveLength(8);
  });

  it('renders categories if they exist', () => {
    const categoriesResponse = {
      result: [
        {
          application: 'android',
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Travel',
          slug: 'Travel',
          type: ADDON_TYPE_EXTENSION,
        },
      ],
    };

    const { store } = dispatchClientMetadata();
    store.dispatch(categoriesLoad(categoriesResponse));
    const { categories } = mapStateToProps(store.getState());

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      categories,
    });

    expect(root.find('.Categories-list').childAt(0).find(Button))
      .toHaveProp('children', 'Games');
    expect(root.find('.Categories-list').childAt(1).find(Button))
      .toHaveProp('children', 'Travel');
  });

  it('sorts and renders the sorted categories', () => {
    const categoriesResponse = {
      result: [
        {
          application: 'android',
          name: 'Travel',
          slug: 'travel',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Music',
          slug: 'music',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Nature',
          slug: 'nature',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
      ],
    };

    const { store } = dispatchClientMetadata();
    store.dispatch(categoriesLoad(categoriesResponse));
    const props = mapStateToProps(store.getState());

    const root = render({
      addonType: ADDON_TYPE_EXTENSION,
      ...props,
    });

    expect(root.find('.Categories-list').childAt(0).find(Button))
      .toHaveProp('children', 'Games');
    expect(root.find('.Categories-list').childAt(1).find(Button))
      .toHaveProp('children', 'Music');
    expect(root.find('.Categories-list').childAt(2).find(Button))
      .toHaveProp('children', 'Nature');
    expect(root.find('.Categories-list').childAt(3).find(Button))
      .toHaveProp('children', 'Travel');
  });

  it('renders a no categories found message', () => {
    const categoriesResponse = { result: [] };
    const { store } = dispatchClientMetadata();
    store.dispatch(categoriesLoad(categoriesResponse));
    const props = mapStateToProps(store.getState());
    const root = render(props);

    expect(root.find('.Categories-none-loaded-message'))
      .toIncludeText('No categories found.');
  });

  it('reports errors', () => {
    const errorHandler = createStubErrorHandler(
      new Error('example of an error')
    );
    const root = render({ categories: {}, errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });
});
