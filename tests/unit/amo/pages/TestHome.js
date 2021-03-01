import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, { HomeBase } from 'amo/pages/Home';
import { categoryResultsLinkTo } from 'amo/components/Categories';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import HeroRecommendation from 'amo/components/HeroRecommendation';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import LoadingText from 'amo/components/LoadingText';
import Page from 'amo/components/Page';
import SecondaryHero from 'amo/components/SecondaryHero';
import {
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  VIEW_CONTEXT_HOME,
} from 'amo/constants';
import Home, {
  FEATURED_COLLECTIONS,
  MOZILLA_USER_ID,
  HomeBase,
  getFeaturedCollectionsMetadata,
  isFeaturedCollection,
} from 'amo/pages/Home';
import {
  FETCH_HOME_DATA,
  fetchHomeData,
  loadHomeData,
} from 'amo/reducers/home';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import {
  DEFAULT_LANG_IN_TESTS,
  createHomeShelves,
  createInternalHomeShelvesWithLang,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeShelf,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const getProps = () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });

    return {
      dispatch: store.dispatch,
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      store,
    };
  };

  function render(otherProps) {
    const allProps = {
      ...getProps(),
      ...otherProps,
    };

    return shallowUntilTarget(<Home {...allProps} />, HomeBase);
  }

  const _createHomeShelves = (
    resultsProps = fakeShelf,
    primaryProps = { addon: fakeAddon },
  ) => {
    return createHomeShelves({ resultsProps, primaryProps });
  };

  const _loadHomeData = ({ store, homeShelves = _createHomeShelves() }) => {
    store.dispatch(loadHomeData({ homeShelves }));
  };

  it('renders a Page component passing `true` for `isHomePage`', () => {
    const root = render();
    expect(root.find(Page)).toHaveProp('isHomePage', true);
  });

  it('renders a shelf with curated themes', () => {
    const expectedThemes = [
      'abstract',
      'nature',
      'film-and-tv',
      'scenery',
      'music',
      'seasonal',
    ];

    const root = render();

    const shelf = root.find('.Home-CuratedThemes');
    expect(shelf.find('.Home-SubjectShelf-text-wrapper')).toHaveLength(1);
    expect(shelf.find('.Home-SubjectShelf-list-item')).toHaveLength(
      expectedThemes.length,
    );

    expectedThemes.forEach((slug) => {
      expect(
        shelf.find({
          to: {
            pathname: getCategoryResultsPathname({
              addonType: ADDON_TYPE_STATIC_THEME,
              slug,
            }),
          },
        }),
      ).toHaveLength(1);
    });
  });

  it('does not render most shelves on android', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });
    const root = render({
      store,
    });

    expect(root.find('.Home-FeaturedCollection')).toHaveLength(0);
    expect(root.find('.Home-RecommendedThemes')).toHaveLength(0);
    expect(root.find('.Home-TrendingExtensions')).toHaveLength(0);
    expect(root.find('.Home-CuratedThemes')).toHaveLength(0);
  });

  it('renders a comment for monitoring', () => {
    const root = render();
    expect(root.find('.do-not-remove').html()).toContain(
      '<!-- Godzilla of browsers -->',
    );
  });

  it('dispatches an action to fetch the add-ons to display', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      store,
    });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeData({
        errorHandlerId: errorHandler.id,
        isDesktopSite: true,
      }),
    );
  });

  it('passes isDesktopSite: false to fetchHomeData on Android', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeData({
        errorHandlerId: errorHandler.id,
        isDesktopSite: false,
      }),
    );
  });

  it('does not dispatch any actions when there is an error', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({ errorHandler, store });

    sinon.assert.notCalled(fakeDispatch);
  });

  // This test case should be updated when we change the `defaultProps`.
  it('fetches add-ons with some defaults', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeData({
        errorHandlerId: errorHandler.id,
        isDesktopSite: true,
      }),
    );
  });

  it('does not fetch data when isLoading is true', () => {
    const { store } = dispatchClientMetadata();

    store.dispatch(
      fetchHomeData({
        errorHandlerId: 'some-error-handler-id',
      }),
    );

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ store });

    sinon.assert.neverCalledWithMatch(fakeDispatch, {
      type: FETCH_HOME_DATA,
    });
  });

  it('dispatches an action to fetch the add-ons to display on update', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });

    const fakeDispatch = sinon.stub(store, 'dispatch');

    const root = render({
      store,
    });
    fakeDispatch.resetHistory();

    // We simulate an update to trigger `componentDidUpdate()`.
    root.setProps();

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeData({
        errorHandlerId: root.instance().props.errorHandler.id,
        isDesktopSite: true,
      }),
    );
  });

  it('does not display a homepage shelf if there are no shelves in state', () => {
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });

    _loadHomeData({
      store,
      homeShelves: {
        results: null,
        primary: null,
        secondary: null,
      },
    });

    const root = render({ store });
    const shelves = root.find(LandingAddonsCard);

    const homepageShelves = shelves.find('.Home-FeaturedCollection');
    expect(homepageShelves).toHaveLength(0);
  });

  it('displays an error if clientApp is Android', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
    });

    const root = render({ errorHandler, store });
    expect(root.find('.Home-noHeroError')).toHaveLength(1);
  });

  it('does not display an error if clientApp is not Android', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });

    const root = render({ errorHandler, store });
    expect(root.find('.Home-noHeroError')).toHaveLength(0);
  });

  it('renders a HeadMetaTags component', () => {
    const root = render();

    expect(root.find(HeadMetaTags)).toHaveLength(1);
    expect(root.find(HeadMetaTags).prop('description')).toMatch(
      /Download Firefox extensions and themes/,
    );
  });

  it('renders the heroHeader for Android', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
    });
    const homeShelves = _createHomeShelves();
    _loadHomeData({ store, homeShelves });
    const root = render({ store });

    expect(root.find('.Home-heroHeader-title')).toHaveLength(1);
    expect(root.find('.Home-heroHeader-subtitle')).toHaveLength(1);
    expect(root.find('.Home-heroHeader-title').text()).toContain(
      homeShelves.secondary.headline[DEFAULT_LANG_IN_TESTS],
    );
    expect(root.find('.Home-heroHeader-subtitle').text()).toContain(
      homeShelves.secondary.description[DEFAULT_LANG_IN_TESTS],
    );
  });

  it('renders the heroHeader for Android in a loading state if shelves are not loaded', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
    });
    const root = render({ store });

    expect(root.find('.Home-heroHeader')).toHaveLength(1);
    expect(
      root.find('.Home-heroHeader-subtitle').find(LoadingText),
    ).toHaveLength(1);
    expect(root.find('.Home-heroHeader-title').find(LoadingText)).toHaveLength(
      1,
    );
  });

  it('does not render the heroHeader for Desktop', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    });
    const homeShelves = _createHomeShelves();
    _loadHomeData({ store, homeShelves });
    const root = render({ store });

    expect(root.find('.Home-heroHeader')).toHaveLength(0);
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });

  describe('Hero Shelves', () => {
    it('renders hero shelves enabled', () => {
      const errorHandler = createStubErrorHandler();

      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
      });
      const homeShelves = _createHomeShelves();
      _loadHomeData({ store, homeShelves });

      const root = render({ errorHandler, store });

      const heroRecommendation = root.find(HeroRecommendation);
      expect(heroRecommendation).toHaveLength(1);
      expect(heroRecommendation).toHaveProp('errorHandler', errorHandler);
      expect(heroRecommendation).toHaveProp(
        'shelfData',
        createInternalHomeShelvesWithLang(homeShelves).primary,
      );

      const secondaryHero = root.find(SecondaryHero);
      expect(secondaryHero).toHaveLength(1);
      expect(secondaryHero).toHaveProp(
        'shelfData',
        createInternalHomeShelvesWithLang(homeShelves).secondary,
      );
    });

    it('passes undefined to hero components if shelves have not been loaded', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
      });

      const root = render({ store });

      const heroRecommendation = root.find(HeroRecommendation);
      expect(heroRecommendation).toHaveLength(1);
      expect(heroRecommendation).toHaveProp('shelfData', undefined);
      const secondary = root.find(SecondaryHero);
      expect(secondary).toHaveLength(1);
      expect(secondary).toHaveProp('shelfData', undefined);
    });

    it('can pass null as shelfData to HeroRecommendation and SecondaryHero', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
      });
      _loadHomeData({
        store,
        homeShelves: { results: null, primary: null, secondary: null },
      });

      const root = render({ store });

      const heroRecommendation = root.find(HeroRecommendation);
      expect(heroRecommendation).toHaveLength(1);
      expect(heroRecommendation).toHaveProp('shelfData', null);
      const secondary = root.find(SecondaryHero);
      expect(secondary).toHaveLength(1);
      expect(secondary).toHaveProp('shelfData', null);
    });

    it('does not render on Android', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      });
      _loadHomeData({ store, homeShelves: _createHomeShelves() });

      const root = render({ store });

      expect(root.find(HeroRecommendation)).toHaveLength(0);
      expect(root.find(SecondaryHero)).toHaveLength(0);
    });
  });
});
