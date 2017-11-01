import { mount } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import { setViewContext } from 'amo/actions/viewContext';
import * as landingActions from 'amo/actions/landing';
import NotFound from 'amo/components/ErrorPage/NotFound';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import LandingPage, {
  LandingPageBase,
  mapStateToProps,
} from 'amo/components/LandingPage';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { ErrorHandler } from 'core/errorHandler';
import { visibleAddonType } from 'core/utils';
import {
  createAddonsApiResult,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';


describe(__filename, () => {
  let store;

  function renderProps({
    _store = store,
    ...otherProps
  } = {}) {
    return {
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION) },
      store: _store,
      ...otherProps,
    };
  }

  function render(props = {}) {
    return shallowUntilTarget(
      <LandingPage {...renderProps(props)} />,
      LandingPageBase
    );
  }

  function renderAndMount(props = {}) {
    const allProps = {
      ...renderProps(props),
      dispatch: store.dispatch,
      store,
    };

    return mount(
      <Provider store={store}>
        <I18nProvider i18n={fakeI18n()}>
          <LandingPageBase {...allProps} />
        </I18nProvider>
      </Provider>
    );
  }

  const _getAndLoadLandingAddons = ({
    addonType = ADDON_TYPE_EXTENSION,
    errorHandler = createStubErrorHandler(),
    ...otherParams
  } = {}) => {
    store.dispatch(landingActions.getLanding({
      addonType,
      errorHandlerId: errorHandler.id,
    }));
    store.dispatch(landingActions.loadLanding({
      addonType,
      featured: createAddonsApiResult([]),
      highlyRated: createAddonsApiResult([]),
      trending: createAddonsApiResult([]),
      ...otherParams,
    }));
  };

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('dispatches setViewContext on load and update', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render();

    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));

    fakeDispatch.reset();
    root.setProps({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_THEME));
  });

  it('dispatches getLanding when results are not loaded', () => {
    const errorHandler = createStubErrorHandler();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    sinon.assert.calledWith(fakeDispatch, landingActions.getLanding({
      addonType: ADDON_TYPE_EXTENSION,
      errorHandlerId: errorHandler.id,
    }));
  });

  it('dispatches getLanding when addon type changes', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const errorHandler = createStubErrorHandler();

    // We load theme add-ons.
    _getAndLoadLandingAddons({ addonType: ADDON_TYPE_THEME, errorHandler });
    store.dispatch(setViewContext(ADDON_TYPE_THEME));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    const root = render({
      errorHandler,
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
      store,
    });
    fakeDispatch.reset();

    // Now we request extension add-ons.
    root.setProps({
      params: { visibleAddonType: visibleAddonType(addonType) },
    });

    sinon.assert.calledWith(fakeDispatch, landingActions.getLanding({
      addonType,
      errorHandlerId: errorHandler.id,
    }));
    sinon.assert.calledWith(fakeDispatch, setViewContext(addonType));
    sinon.assert.callCount(fakeDispatch, 2);
  });

  it('does not dispatch getLanding when addon type does not change', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const params = { visibleAddonType: visibleAddonType(addonType) };
    const errorHandler = createStubErrorHandler();

    // We load extension add-ons.
    _getAndLoadLandingAddons({ addonType, errorHandler });

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ errorHandler, params, store });

    fakeDispatch.reset();

    // We request extension add-ons again.
    root.setProps({ params });

    // Make sure only setViewContext is dispatched, not getLanding
    sinon.assert.calledWith(fakeDispatch, setViewContext(addonType));
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('does not dispatch getLanding while loading', () => {
    const errorHandler = createStubErrorHandler();

    store.dispatch(landingActions.getLanding({
      addonType: ADDON_TYPE_EXTENSION,
      errorHandlerId: errorHandler.id,
    }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    // Make sure only setViewContext is dispatched, not getLanding
    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('does not dispatch getLanding when there is an error', () => {
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(new Error('some error'));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    // Make sure only setViewContext is dispatched, not getLanding
    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('renders an error', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));
    const root = render({ errorHandler });

    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('renders a LandingPage with no addons set', () => {
    const root = renderAndMount({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION) },
    });

    expect(root).toIncludeText('Featured extensions');
    expect(root).toIncludeText('See more featured extensions');
  });

  it('renders a link to all categories', () => {
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const root = render({ params: fakeParams });

    expect(root.find('.LandingPage-button'))
      .toHaveProp('children', 'Explore all categories');
  });

  it('sets the links in each footer for extensions', () => {
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const root = render({ params: fakeParams });

    const addonCards = root.find(LandingAddonsCard);
    expect(addonCards.at(0)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, featured: true },
    });
    expect(addonCards.at(1)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_TOP_RATED },
    });
    expect(addonCards.at(2)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_EXTENSION, sort: SEARCH_SORT_TRENDING },
    });
  });

  it('sets the links in each footer for themes', () => {
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
    };
    const root = render({ params: fakeParams });

    const addonCards = root.find(LandingAddonsCard);
    expect(addonCards.at(0)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, featured: true },
    });
    expect(addonCards.at(1)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TOP_RATED },
    });
    expect(addonCards.at(2)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType: ADDON_TYPE_THEME, sort: SEARCH_SORT_TRENDING },
    });
  });

  it('renders a LandingPage with themes HTML', () => {
    const root = renderAndMount({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    expect(root).toIncludeText('Featured themes');
    expect(root).toIncludeText('See more featured themes');
  });

  it('renders each add-on when set', () => {
    store.dispatch(landingActions.loadLanding({
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
    }));
    const root = renderAndMount({
      ...mapStateToProps(store.getState()),
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_THEME) },
    });

    expect(
      root.find('.SearchResult-name')
        .map((heading) => heading.text()))
      .toEqual([
        'Howdy', 'Howdy again', 'High', 'High again', 'Pop', 'Pop again',
      ]);
  });

  it('renders not found if add-on type is not supported', () => {
    const root = render({ params: { visibleAddonType: 'XUL' } });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders not found if updated add-on type is not supported', () => {
    const root = render({
      params: { visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION) },
    });
    root.setProps({ params: { visibleAddonType: 'XUL' } });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('dispatches getLanding when category filter is set', () => {
    const addonType = ADDON_TYPE_EXTENSION;

    const errorHandler = createStubErrorHandler();

    // This loads a set of add-ons for a category.
    store.dispatch(landingActions.getLanding({
      addonType,
      category: 'some-category',
      errorHandlerId: errorHandler.id,
    }));
    store.dispatch(landingActions.loadLanding({
      addonType,
      featured: createAddonsApiResult([]),
      highlyRated: createAddonsApiResult([]),
      trending: createAddonsApiResult([]),
    }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.calledWith(fakeDispatch, landingActions.getLanding({
      addonType,
      errorHandlerId: errorHandler.id,
    }));
    sinon.assert.callCount(fakeDispatch, 2);
  });

  it('does not dispatch setViewContext when addonType does not change', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const errorHandler = createStubErrorHandler();
    const params = { visibleAddonType: visibleAddonType(addonType) };

    store.dispatch(landingActions.getLanding({
      addonType,
      errorHandlerId: errorHandler.id,
    }));
    store.dispatch(setViewContext(addonType));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ errorHandler, params, store });

    fakeDispatch.reset();
    root.setProps({ params });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch setViewContext when context does not change', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const errorHandler = createStubErrorHandler();
    const params = { visibleAddonType: visibleAddonType(addonType) };

    store.dispatch(landingActions.getLanding({
      addonType,
      errorHandlerId: errorHandler.id,
    }));
    store.dispatch(setViewContext(addonType));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ errorHandler, params, store });

    const { context } = store.getState().viewContext;

    fakeDispatch.reset();
    root.setProps({ context });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('renders an HTML title for themes', () => {
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_THEME),
    };
    const wrapper = render({ params: fakeParams });
    expect(wrapper.find('title')).toHaveText('Themes');
  });

  it('renders an HTML title for extensions', () => {
    const fakeParams = {
      visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const wrapper = render({ params: fakeParams });
    expect(wrapper.find('title')).toHaveText('Extensions');
  });
});
