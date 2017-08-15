import { shallow } from 'enzyme';
import React from 'react';

import * as featuredActions from 'amo/actions/featured';
import { setViewContext } from 'amo/actions/viewContext';
import {
  FeaturedAddonsBase,
  mapStateToProps,
} from 'amo/components/FeaturedAddons';
import SearchResults from 'amo/components/SearchResults';
import createStore from 'amo/store';
import {
  ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { visibleAddonType } from 'core/utils';
import {
  createAddonsApiResult, fakeAddon, signedInApiState,
} from 'tests/unit/amo/helpers';
import { createStubErrorHandler, getFakeI18nInst } from 'tests/unit/helpers';


describe('<FeaturedAddons />', () => {
  let errorHandler;
  let store;

  beforeEach(() => {
    const initialState = { api: signedInApiState };
    store = createStore(initialState).store;
    errorHandler = createStubErrorHandler();
  });

  function _getFeatured(args = {}) {
    return featuredActions.getFeatured({
      errorHandlerId: errorHandler.id,
      ...args,
    });
  }

  function _loadFeatured({
    addonType = ADDON_TYPE_EXTENSION,
    results = [fakeAddon],
  } = {}) {
    const { entities, result } = createAddonsApiResult(results);
    return featuredActions.loadFeatured({
      addonType, entities, result,
    });
  }

  function render(customProps = {}) {
    const props = {
      addonType: ADDON_TYPE_EXTENSION,
      dispatch: sinon.stub(),
      errorHandler,
      i18n: getFakeI18nInst(),
      loading: false,
      params: {
        visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
      },
      ...customProps,
    };
    return shallow(<FeaturedAddonsBase {...props} />);
  }

  it('fetches featured add-ons when component mounts', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const dispatch = sinon.stub();
    const customErrorHandler = new ErrorHandler({
      id: 'custom-error-handler',
      dispatch: sinon.stub(),
    });
    render({
      dispatch,
      errorHandler: customErrorHandler,
      params: {
        visibleAddonType: visibleAddonType(addonType),
      },
      loading: false,
      results: null,
    });

    sinon.assert.calledWith(dispatch, _getFeatured({
      addonType,
      errorHandlerId: customErrorHandler.id,
    }));
  });

  it('fetches featured add-ons when component is updated', () => {
    const firstAddonType = ADDON_TYPE_EXTENSION;
    const secondAddonType = ADDON_TYPE_THEME;
    const dispatch = sinon.stub();

    const root = render({
      dispatch,
      params: {
        visibleAddonType: visibleAddonType(firstAddonType),
      },
      loading: false,
      results: null,
    });

    dispatch.reset();

    root.setProps({
      params: {
        visibleAddonType: visibleAddonType(secondAddonType),
      },
    });

    sinon.assert.calledWith(dispatch,
      _getFeatured({ addonType: secondAddonType }));
  });

  it('fetches featured add-ons when addonType changes', () => {
    const firstAddonType = ADDON_TYPE_EXTENSION;
    const secondAddonType = ADDON_TYPE_THEME;
    const dispatch = sinon.stub();

    store.dispatch(_loadFeatured({ addonType: firstAddonType }));
    // Get the results props from the state mapper.
    const mappedProps = mapStateToProps(store.getState());

    const root = render({
      dispatch,
      params: {
        visibleAddonType: visibleAddonType(firstAddonType),
      },
      ...mappedProps,
    });

    dispatch.reset();

    root.setProps({
      params: {
        visibleAddonType: visibleAddonType(secondAddonType),
      },
    });

    sinon.assert.calledWith(dispatch,
      _getFeatured({ addonType: secondAddonType }));
  });

  it('does not fetch featured add-ons while component is loading', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const dispatch = sinon.stub();

    const root = render({
      dispatch,
      params: {
        visibleAddonType: visibleAddonType(addonType),
      },
      loading: false,
      results: null,
    });

    dispatch.reset();

    root.setProps({
      loading: true,
      results: null,
    });

    sinon.assert.notCalled(dispatch);
  });

  it('does not fetch featured add-ons when results are loaded', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const dispatch = sinon.stub();

    store.dispatch(_loadFeatured());
    // Get the results props from the state mapper.
    const mappedProps = mapStateToProps(store.getState());

    const root = render({
      dispatch,
      params: {
        visibleAddonType: visibleAddonType(addonType),
      },
      ...mappedProps,
    });

    dispatch.reset();

    root.setProps();

    sinon.assert.notCalled(dispatch);
  });

  it('does not fetch featured add-ons when results are loaded + empty', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const dispatch = sinon.stub();

    store.dispatch(_loadFeatured({ results: [] }));
    // This will make props.results === []
    const mappedProps = mapStateToProps(store.getState());

    render({
      dispatch,
      params: {
        visibleAddonType: visibleAddonType(addonType),
      },
      ...mappedProps,
    });

    // Make sure only the view context was dispatched, not getFeatured()
    sinon.assert.calledWith(dispatch, setViewContext(addonType));
    sinon.assert.callCount(dispatch, 1);
  });

  it('renders a header without a configured addonType', () => {
    const root = render({
      addonType: null,
      params: {
        visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
      },
    });

    expect(root.find('.FeaturedAddons-header'))
      .toIncludeText('More Featured Extensions');
  });

  it('renders a header when fetching extensions', () => {
    store.dispatch(_getFeatured({ addonType: ADDON_TYPE_EXTENSION }));
    const root = render(mapStateToProps(store.getState()));

    expect(root.find('.FeaturedAddons-header'))
      .toIncludeText('More Featured Extensions');
  });

  it('renders a header when fetching themes', () => {
    store.dispatch(_getFeatured({ addonType: ADDON_TYPE_THEME }));
    const root = render(mapStateToProps(store.getState()));

    expect(root.find('.FeaturedAddons-header'))
      .toIncludeText('More Featured Themes');
  });

  it('renders a header for a configured addonType', () => {
    const root = render({
      addonType: ADDON_TYPE_THEME,
      params: {
        visibleAddonType: visibleAddonType(ADDON_TYPE_EXTENSION),
      },
    });

    expect(root.find('.FeaturedAddons-header'))
      .toIncludeText('More Featured Themes');
  });

  it('renders result placeholders when fetching addons', () => {
    store.dispatch(_getFeatured({ addonType: ADDON_TYPE_EXTENSION }));
    const root = render(mapStateToProps(store.getState()));

    expect(root.find(SearchResults)).toHaveProp('loading', true);
  });

  it('does not render old results while loading', () => {
    // Load results.
    store.dispatch(_loadFeatured());
    // Fetch some new results.
    store.dispatch(_getFeatured({ addonType: ADDON_TYPE_EXTENSION }));
    const root = render(mapStateToProps(store.getState()));

    expect(root.find(SearchResults)).toHaveProp('loading', true);
    expect(root.find(SearchResults)).toHaveProp('results', null);
  });

  it('renders each add-on when set', () => {
    store.dispatch(_loadFeatured({
      results: [
        { ...fakeAddon, name: 'Howdy', slug: 'howdy' },
        { ...fakeAddon, name: 'Howdy again', slug: 'howdy-again' },
      ],
    }));
    const root = render(mapStateToProps(store.getState()));

    expect(
      root.find(SearchResults).prop('results').map((result) => result.name)
    ).toEqual(['Howdy', 'Howdy again']);
  });

  it('throws if add-on type is not supported', () => {
    expect(() => {
      render({ addonType: 'XUL' });
    }).toThrowError('Invalid addonType: "XUL"');
  });

  it('sets the viewContext to the addonType', () => {
    const dispatch = sinon.stub();
    const addonType = ADDON_TYPE_THEME;

    render({
      dispatch,
      params: {
        visibleAddonType: visibleAddonType(addonType),
      },
    });

    sinon.assert.calledWith(dispatch, setViewContext(addonType));
  });
});
