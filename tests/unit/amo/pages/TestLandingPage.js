import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import { getLanding, loadLanding } from 'amo/reducers/landing';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import LandingPage, { LandingPageBase } from 'amo/pages/LandingPage';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  RECOMMENDED,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { visibleAddonType as getVisibleAddonType } from 'core/utils';
import {
  createAddonsApiResult,
  createLocalizedString,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';

describe(__filename, () => {
  let store;

  function renderProps({ _store = store, ...otherProps } = {}) {
    return {
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      match: {
        params: { visibleAddonType: getVisibleAddonType(ADDON_TYPE_EXTENSION) },
      },
      store: _store,
      ...otherProps,
    };
  }

  function render(props = {}) {
    return shallowUntilTarget(
      <LandingPage {...renderProps(props)} />,
      LandingPageBase,
    );
  }

  const _getAndLoadLandingAddons = ({
    addonType = ADDON_TYPE_EXTENSION,
    errorHandler = createStubErrorHandler(),
    ...otherParams
  } = {}) => {
    store.dispatch(
      getLanding({
        addonType,
        errorHandlerId: errorHandler.id,
      }),
    );
    store.dispatch(
      loadLanding({
        addonType,
        recommended: createAddonsApiResult([
          {
            ...fakeAddon,
            name: createLocalizedString('Featured'),
            slug: 'recommended',
          },
        ]),
        highlyRated: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('High'), slug: 'high' },
        ]),
        trending: createAddonsApiResult([
          {
            ...fakeAddon,
            name: createLocalizedString('Trending'),
            slug: 'trending',
          },
        ]),
        ...otherParams,
      }),
    );
  };

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  it('dispatches setViewContext on load and update', () => {
    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render();

    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));

    fakeDispatch.resetHistory();
    root.setProps({
      match: {
        params: {
          visibleAddonType: getVisibleAddonType(ADDON_TYPE_STATIC_THEME),
        },
      },
    });

    sinon.assert.calledWith(
      fakeDispatch,
      setViewContext(ADDON_TYPE_STATIC_THEME),
    );
  });

  it('dispatches getLanding when results are not loaded', () => {
    const errorHandler = createStubErrorHandler();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    sinon.assert.calledWith(
      fakeDispatch,
      getLanding({
        addonType: ADDON_TYPE_EXTENSION,
        errorHandlerId: errorHandler.id,
      }),
    );
  });

  it('dispatches getLanding when addon type changes', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const errorHandler = createStubErrorHandler();

    // We load theme add-ons.
    _getAndLoadLandingAddons({
      addonType: ADDON_TYPE_STATIC_THEME,
      errorHandler,
    });
    store.dispatch(setViewContext(ADDON_TYPE_STATIC_THEME));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    const root = render({
      errorHandler,
      match: {
        params: {
          visibleAddonType: getVisibleAddonType(ADDON_TYPE_STATIC_THEME),
        },
      },
      store,
    });
    fakeDispatch.resetHistory();

    // Now we request extension add-ons.
    root.setProps({
      match: {
        params: { visibleAddonType: getVisibleAddonType(addonType) },
      },
    });

    sinon.assert.calledWith(
      fakeDispatch,
      getLanding({
        addonType,
        errorHandlerId: errorHandler.id,
      }),
    );
    sinon.assert.calledWith(fakeDispatch, setViewContext(addonType));
    sinon.assert.callCount(fakeDispatch, 2);
  });

  it('does not dispatch getLanding when addon type does not change', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const params = { visibleAddonType: getVisibleAddonType(addonType) };
    const match = { params };
    const errorHandler = createStubErrorHandler();

    // We load extension add-ons.
    _getAndLoadLandingAddons({ addonType, errorHandler });

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ errorHandler, match, store });

    fakeDispatch.resetHistory();

    // We request extension add-ons again.
    root.setProps({ match });

    // Make sure only setViewContext is dispatched, not getLanding
    sinon.assert.calledWith(fakeDispatch, setViewContext(addonType));
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('does not dispatch getLanding while loading', () => {
    const errorHandler = createStubErrorHandler();

    store.dispatch(
      getLanding({
        addonType: ADDON_TYPE_EXTENSION,
        errorHandlerId: errorHandler.id,
      }),
    );

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
    const root = render({
      match: {
        params: { visibleAddonType: getVisibleAddonType(ADDON_TYPE_EXTENSION) },
      },
    });
    expect(root.find('.LandingPage-heading-content')).toIncludeText(
      'Explore powerful tools and features',
    );
  });

  it('renders a link to all categories', () => {
    const fakeParams = {
      visibleAddonType: getVisibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const match = { params: fakeParams };

    const root = render({ match });

    expect(root.find('.LandingPage-button')).toHaveProp(
      'children',
      'Explore all categories',
    );
  });

  it('does not render a theme class name when page type is extensions', () => {
    const root = render({
      params: { visibleAddonType: getVisibleAddonType(ADDON_TYPE_EXTENSION) },
    });
    expect(root.find('.LandingPage')).not.toHaveClassName(
      '.LandingPage--theme',
    );
  });

  it('renders a theme class name when page type is themes', () => {
    const root = render({
      match: {
        params: {
          visibleAddonType: getVisibleAddonType(ADDON_TYPE_STATIC_THEME),
        },
      },
    });
    expect(root.find('.LandingPage')).toHaveClassName('.LandingPage--theme');
  });

  it('sets the links in each footer for extensions', () => {
    store.dispatch(
      loadLanding({
        addonType: ADDON_TYPE_EXTENSION,
        recommended: createAddonsApiResult([
          {
            ...fakeAddon,
            name: createLocalizedString('Featured'),
            slug: 'recommended',
          },
        ]),
        highlyRated: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('High'), slug: 'high' },
        ]),
        trending: createAddonsApiResult([
          {
            ...fakeAddon,
            name: createLocalizedString('Trending'),
            slug: 'trending',
          },
        ]),
      }),
    );

    const fakeParams = {
      visibleAddonType: getVisibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const match = { params: fakeParams };

    const root = render({ match });

    const addonCards = root.find(LandingAddonsCard);
    expect(addonCards.at(0)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        promoted: RECOMMENDED,
        sort: SEARCH_SORT_RANDOM,
      },
    });
    expect(addonCards.at(1)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        promoted: RECOMMENDED,
        sort: SEARCH_SORT_TOP_RATED,
      },
    });
    expect(addonCards.at(2)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        promoted: RECOMMENDED,
        sort: SEARCH_SORT_TRENDING,
      },
    });
  });

  it('sets the links in each footer for themes', () => {
    const addonType = ADDON_TYPE_STATIC_THEME;

    _getAndLoadLandingAddons({ addonType });

    const fakeParams = {
      visibleAddonType: getVisibleAddonType(ADDON_TYPE_STATIC_THEME),
    };

    const match = { params: fakeParams };

    const root = render({ match });

    const addonCards = root.find(LandingAddonsCard);
    expect(addonCards.at(0)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType,
        promoted: RECOMMENDED,
        sort: SEARCH_SORT_RANDOM,
      },
    });
    expect(addonCards.at(1)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType, sort: SEARCH_SORT_TOP_RATED },
    });
    expect(addonCards.at(2)).toHaveProp('footerLink', {
      pathname: '/search/',
      query: { addonType, sort: SEARCH_SORT_TRENDING },
    });
  });

  it('passes an isTheme prop as true if type is a theme', () => {
    _getAndLoadLandingAddons({ addonType: ADDON_TYPE_STATIC_THEME });

    const root = render({
      match: {
        params: {
          visibleAddonType: getVisibleAddonType(ADDON_TYPE_STATIC_THEME),
        },
      },
    });

    root.find(LandingAddonsCard).forEach((card) => {
      expect(card).toHaveProp('isTheme', true);
    });
  });

  it('passes an isTheme prop as false if type is an extension', () => {
    _getAndLoadLandingAddons({ addonType: ADDON_TYPE_EXTENSION });

    const root = render({
      match: {
        params: {
          visibleAddonType: getVisibleAddonType(ADDON_TYPE_EXTENSION),
        },
      },
    });

    root.find(LandingAddonsCard).forEach((card) => {
      expect(card).toHaveProp('isTheme', false);
    });
  });

  it('renders a LandingPage with themes HTML', () => {
    const root = render({
      match: {
        params: {
          visibleAddonType: getVisibleAddonType(ADDON_TYPE_STATIC_THEME),
        },
      },
    });

    expect(root.find('.LandingPage-heading-content')).toIncludeText(
      "Change your browser's appearance",
    );
  });

  it('renders each add-on when set', () => {
    store.dispatch(
      loadLanding({
        addonType: ADDON_TYPE_STATIC_THEME,
        recommended: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('Howdy'), slug: 'howdy' },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy again'),
            slug: 'howdy-again',
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy 2'),
            slug: 'howdy-2',
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy again 2'),
            slug: 'howdy-again-2',
          },
        ]),
        highlyRated: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('High'), slug: 'high' },
          {
            ...fakeAddon,
            name: createLocalizedString('High again'),
            slug: 'high-again',
          },
        ]),
        trending: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('Pop'), slug: 'pop' },
          {
            ...fakeAddon,
            name: createLocalizedString('Pop again'),
            slug: 'pop-again',
          },
        ]),
      }),
    );

    const root = render({
      match: {
        params: {
          visibleAddonType: getVisibleAddonType(ADDON_TYPE_STATIC_THEME),
        },
      },
    });

    const landingShelves = root.find(LandingAddonsCard);

    // recommended
    expect(
      landingShelves
        .at(0)
        .prop('addons')
        .map((addon) => addon.name),
    ).toEqual(['Howdy', 'Howdy again', 'Howdy 2', 'Howdy again 2']);
    // highly rated
    expect(
      landingShelves
        .at(1)
        .prop('addons')
        .map((addon) => addon.name),
    ).toEqual(['High', 'High again']);
    // trending
    expect(
      landingShelves
        .at(2)
        .prop('addons')
        .map((addon) => addon.name),
    ).toEqual(['Pop', 'Pop again']);

    expect(landingShelves.at(0)).toHaveProp(
      'footerText',
      'See more recommended themes',
    );
  });

  it('dispatches getLanding when category filter is set', () => {
    const addonType = ADDON_TYPE_EXTENSION;

    const errorHandler = createStubErrorHandler();

    // This loads a set of add-ons for a category.
    store.dispatch(
      getLanding({
        addonType,
        category: 'some-category',
        errorHandlerId: errorHandler.id,
      }),
    );
    store.dispatch(
      loadLanding({
        addonType,
        recommended: createAddonsApiResult([]),
        highlyRated: createAddonsApiResult([]),
        trending: createAddonsApiResult([]),
      }),
    );

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_EXTENSION));
    sinon.assert.calledWith(
      fakeDispatch,
      getLanding({
        addonType,
        errorHandlerId: errorHandler.id,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 2);
  });

  it('does not dispatch setViewContext when addonType does not change', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const errorHandler = createStubErrorHandler();
    const params = { visibleAddonType: getVisibleAddonType(addonType) };
    const match = { params };

    store.dispatch(
      getLanding({
        addonType,
        errorHandlerId: errorHandler.id,
      }),
    );
    store.dispatch(setViewContext(addonType));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ errorHandler, match, store });

    fakeDispatch.resetHistory();
    root.setProps({ match });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch setViewContext when context does not change', () => {
    const addonType = ADDON_TYPE_EXTENSION;
    const errorHandler = createStubErrorHandler();
    const params = { visibleAddonType: getVisibleAddonType(addonType) };
    const match = { params };

    store.dispatch(
      getLanding({
        addonType,
        errorHandlerId: errorHandler.id,
      }),
    );
    store.dispatch(setViewContext(addonType));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ errorHandler, match, store });

    const { context } = store.getState().viewContext;

    fakeDispatch.resetHistory();
    root.setProps({ context });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('renders an HTML title for themes', () => {
    const fakeParams = {
      visibleAddonType: getVisibleAddonType(ADDON_TYPE_STATIC_THEME),
    };
    const match = { params: fakeParams };

    const wrapper = render({ match });
    expect(wrapper.find('title')).toHaveText('Themes');
  });

  it('renders an HTML title for extensions', () => {
    const fakeParams = {
      visibleAddonType: getVisibleAddonType(ADDON_TYPE_EXTENSION),
    };
    const match = { params: fakeParams };

    const wrapper = render({ match });
    expect(wrapper.find('title')).toHaveText('Extensions');
  });

  it('hides the trending shelf when there are no add-ons for it', () => {
    store.dispatch(
      loadLanding({
        addonType: ADDON_TYPE_STATIC_THEME,
        recommended: createAddonsApiResult([
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy again'),
            slug: 'howdy-again',
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy 2'),
            slug: 'howdy-2',
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy again 2'),
            slug: 'howdy-again-2',
          },
        ]),
        highlyRated: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('High'), slug: 'high' },
          {
            ...fakeAddon,
            name: createLocalizedString('High again'),
            slug: 'high-again',
          },
        ]),
        trending: createAddonsApiResult([]),
      }),
    );

    const root = render();
    const landingShelves = root.find(LandingAddonsCard);

    expect(root.find(LandingAddonsCard)).toHaveLength(2);
    expect(landingShelves.at(0)).toHaveClassName('RecommendedAddons');
    expect(landingShelves.at(1)).toHaveClassName('HighlyRatedAddons');
  });

  it('hides the recommended shelf when there are no add-ons for it', () => {
    store.dispatch(
      loadLanding({
        addonType: ADDON_TYPE_STATIC_THEME,
        recommended: createAddonsApiResult([]),
        highlyRated: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('High'), slug: 'high' },
          {
            ...fakeAddon,
            name: createLocalizedString('High again'),
            slug: 'high-again',
          },
        ]),
        trending: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('Pop'), slug: 'pop' },
          {
            ...fakeAddon,
            name: createLocalizedString('Pop again'),
            slug: 'pop-again',
          },
        ]),
      }),
    );

    const root = render();
    const landingShelves = root.find(LandingAddonsCard);

    expect(root.find(LandingAddonsCard)).toHaveLength(2);
    expect(landingShelves.at(0)).toHaveClassName('HighlyRatedAddons');
    expect(landingShelves.at(1)).toHaveClassName('TrendingAddons');
  });

  it('hides the highly rated shelf when there are no add-ons for it', () => {
    store.dispatch(
      loadLanding({
        addonType: ADDON_TYPE_STATIC_THEME,
        recommended: createAddonsApiResult([
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy again'),
            slug: 'howdy-again',
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy 2'),
            slug: 'howdy-2',
          },
          {
            ...fakeAddon,
            name: createLocalizedString('Howdy again 2'),
            slug: 'howdy-again-2',
          },
        ]),
        highlyRated: createAddonsApiResult([]),
        trending: createAddonsApiResult([
          { ...fakeAddon, name: createLocalizedString('Pop'), slug: 'pop' },
          {
            ...fakeAddon,
            name: createLocalizedString('Pop again'),
            slug: 'pop-again',
          },
        ]),
      }),
    );

    const root = render();
    const landingShelves = root.find(LandingAddonsCard);

    expect(root.find(LandingAddonsCard)).toHaveLength(2);
    expect(landingShelves.at(0)).toHaveClassName('RecommendedAddons');
    expect(landingShelves.at(1)).toHaveClassName('TrendingAddons');
  });

  it.each([
    [
      ADDON_TYPE_EXTENSION,
      'Extensions',
      /Download Firefox Extensions to add features/,
    ],
    [ADDON_TYPE_STATIC_THEME, 'Themes', /Download themes to change/],
  ])(
    'renders a HeadMetaTags component for %s',
    (addonType, expectedTitle, expectedDescriptionMatch) => {
      const root = render({
        match: {
          params: { visibleAddonType: getVisibleAddonType(addonType) },
        },
      });

      expect(root.find(HeadMetaTags)).toHaveLength(1);
      expect(root.find(HeadMetaTags).prop('title')).toEqual(expectedTitle);
      expect(root.find(HeadMetaTags).prop('description')).toMatch(
        expectedDescriptionMatch,
      );
    },
  );

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });
});
