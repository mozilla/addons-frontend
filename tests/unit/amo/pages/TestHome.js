import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
  FEATURED_COLLECTIONS,
  MOZILLA_USER_ID,
  HomeBase,
  getFeaturedCollectionsMetadata,
  isFeaturedCollection,
} from 'amo/pages/Home';
import { categoryResultsLinkTo } from 'amo/components/Categories';
import FeaturedCollectionCard from 'amo/components/FeaturedCollectionCard';
import HomeHeroGuides from 'amo/components/HomeHeroGuides';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import HeroRecommendation from 'amo/components/HeroRecommendation';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Page from 'amo/components/Page';
import SecondaryHero from 'amo/components/SecondaryHero';
import {
  FETCH_HOME_DATA,
  createInternalHeroShelves,
  fetchHomeData,
  loadHomeData,
} from 'amo/reducers/home';
import { createInternalCollection } from 'amo/reducers/collections';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  ADDON_TYPE_THEMES_FILTER,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_RANDOM,
  SEARCH_SORT_TRENDING,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createAddonsApiResult,
  createFakeCollectionAddons,
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  createHeroShelves,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const getProps = () => {
    const { store } = dispatchClientMetadata();

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

  const _createHeroShelves = (primaryProps = { addon: fakeAddon }) => {
    return createHeroShelves({ primaryProps });
  };

  const _loadHomeData = ({
    store,
    collections = [],
    heroShelves = _createHeroShelves(),
    shelves = {},
  }) => {
    store.dispatch(loadHomeData({ collections, heroShelves, shelves }));
  };

  it('renders a Page component passing `true` for `isHomePage`', () => {
    const root = render();
    expect(root.find(Page)).toHaveProp('isHomePage', true);
  });

  // Note: We often have more than one collection to display, which is why the
  // it.each logic is used below.
  it.each([0])(
    `renders a featured collection shelf at position %s`,
    (index) => {
      const collectionMetadata = getFeaturedCollectionsMetadata(fakeI18n())[
        index
      ];
      const root = render();

      const shelves = root.find(FeaturedCollectionCard);
      const shelf = shelves.find('.Home-FeaturedCollection').at(index);

      expect(shelf).toHaveProp('footerText', collectionMetadata.footerText);
      expect(shelf).toHaveProp('header', collectionMetadata.header);
      expect(shelf).toHaveProp('slug', collectionMetadata.slug);
      expect(shelf).toHaveProp('userId', MOZILLA_USER_ID);
      expect(shelf).toHaveProp('loading', true);
    },
  );

  it.each([true, false])(
    'renders a featured/recommended extensions shelf, enableFeatureRecommendedBadges: %s',
    (enableFeatureRecommendedBadges) => {
      const _config = getFakeConfig({ enableFeatureRecommendedBadges });
      const root = render({ _config });

      const shelves = root.find(LandingAddonsCard);
      const shelf = shelves.find('.Home-RecommendedExtensions');
      expect(shelf).toHaveProp(
        'header',
        enableFeatureRecommendedBadges
          ? 'Recommended extensions'
          : 'Featured extensions',
      );
      expect(shelf).toHaveProp(
        'footerText',
        enableFeatureRecommendedBadges
          ? 'See more recommended extensions'
          : 'See more featured extensions',
      );
      expect(shelf).toHaveProp('footerLink', {
        pathname: '/search/',
        query: {
          addonType: ADDON_TYPE_EXTENSION,
          featured: enableFeatureRecommendedBadges ? undefined : true,
          recommended: enableFeatureRecommendedBadges ? true : undefined,
          sort: enableFeatureRecommendedBadges ? SEARCH_SORT_RANDOM : undefined,
        },
      });
      expect(shelf).toHaveProp('loading', true);
    },
  );

  it.each([true, false])(
    'renders a featured/recommended themes shelf if includeRecommendedThemes is true, enableFeatureRecommendedBadges: %s',
    (enableFeatureRecommendedBadges) => {
      const _config = getFakeConfig({ enableFeatureRecommendedBadges });
      const root = render({ _config, includeRecommendedThemes: true });

      const shelves = root.find(LandingAddonsCard);
      const shelf = shelves.find('.Home-RecommendedThemes');
      expect(shelf).toHaveProp(
        'header',
        enableFeatureRecommendedBadges
          ? 'Recommended themes'
          : 'Featured themes',
      );
      expect(shelf).toHaveProp(
        'footerText',
        enableFeatureRecommendedBadges
          ? 'See more recommended themes'
          : 'See more featured themes',
      );
      expect(shelf).toHaveProp('footerLink', {
        pathname: '/search/',
        query: {
          addonType: ADDON_TYPE_THEMES_FILTER,
          featured: enableFeatureRecommendedBadges ? undefined : true,
          recommended: enableFeatureRecommendedBadges ? true : undefined,
          sort: enableFeatureRecommendedBadges ? SEARCH_SORT_RANDOM : undefined,
        },
      });
      expect(shelf).toHaveProp('loading', true);
      expect(shelf).toHaveProp('isTheme', true);
    },
  );

  it('does not render a recommended themes shelf if includeRecommendedThemes is false', () => {
    const root = render({ includeRecommendedThemes: false });

    const shelves = root.find(LandingAddonsCard);
    expect(shelves.find('.Home-RecommendedThemes')).toHaveLength(0);
  });

  it('does not render a trending extensions shelf if includeTrendingExtensions is false', () => {
    const root = render({ includeTrendingExtensions: false });

    const shelves = root.find(LandingAddonsCard);
    expect(shelves.find('.Home-TrendingExtensions')).toHaveLength(0);
  });

  it.each([true, false])(
    'renders a trending extensions shelf when includeTrendingExtensions is true, enableFeatureRecommendedBadges: %s',
    (enableFeatureRecommendedBadges) => {
      const _config = getFakeConfig({ enableFeatureRecommendedBadges });
      const root = render({ _config, includeTrendingExtensions: true });

      const shelves = root.find(LandingAddonsCard);
      const shelf = shelves.find('.Home-TrendingExtensions');
      expect(shelf).toHaveProp('header', 'Trending extensions');
      expect(shelf).toHaveProp('footerText', 'See more trending extensions');
      expect(shelf).toHaveProp('footerLink', {
        pathname: '/search/',
        query: {
          addonType: ADDON_TYPE_EXTENSION,
          recommended: enableFeatureRecommendedBadges ? true : undefined,
          sort: SEARCH_SORT_TRENDING,
        },
      });
      expect(shelf).toHaveProp('loading', true);
    },
  );

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
          to: categoryResultsLinkTo({ addonType: ADDON_TYPE_THEME, slug }),
        }),
      ).toHaveLength(1);
    });
  });

  it('renders a comment for monitoring', () => {
    const root = render();
    expect(root.find('.do-not-remove').html()).toContain(
      '<!-- Godzilla of browsers -->',
    );
  });

  it('dispatches an action to fetch the add-ons to display', () => {
    const enableFeatureRecommendedBadges = true;
    const includeRecommendedThemes = false;
    const includeTrendingExtensions = false;
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    const _config = getFakeConfig({ enableFeatureRecommendedBadges });

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      _config,
      errorHandler,
      includeRecommendedThemes,
      includeTrendingExtensions,
      store,
    });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeData({
        enableFeatureRecommendedBadges,
        errorHandlerId: errorHandler.id,
        collectionsToFetch: FEATURED_COLLECTIONS,
        includeRecommendedThemes,
        includeTrendingExtensions,
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
    const enableFeatureRecommendedBadges = true;
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    const _config = getFakeConfig({ enableFeatureRecommendedBadges });

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ _config, errorHandler, store });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeData({
        enableFeatureRecommendedBadges,
        errorHandlerId: errorHandler.id,
        collectionsToFetch: FEATURED_COLLECTIONS,
        includeRecommendedThemes: true,
        includeTrendingExtensions: false,
      }),
    );
  });

  it('does not fetch the add-ons when results are already loaded', () => {
    const { store } = dispatchClientMetadata();

    const addons = [{ ...fakeAddon, slug: 'addon' }];
    const collectionAddons = createFakeCollectionAddons();

    const collections = [
      createFakeCollectionAddonsListResponse({ addons: collectionAddons }),
    ];
    const recommendedExtensions = createAddonsApiResult(addons);

    _loadHomeData({
      store,
      collections,
      shelves: { recommendedExtensions },
    });

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ includeRecommendedThemes: false, store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));

    const firstCollectionShelf = root.find('.Home-FeaturedCollection');
    expect(firstCollectionShelf).toHaveProp('loading', false);
    expect(firstCollectionShelf).toHaveProp(
      'addons',
      collectionAddons.map((addon) => createInternalAddon(addon.addon)),
    );

    const recommendedExtensionsShelf = root.find('.Home-RecommendedExtensions');
    expect(recommendedExtensionsShelf).toHaveProp('loading', false);
    expect(recommendedExtensionsShelf).toHaveProp(
      'addons',
      addons.map((addon) => createInternalAddon(addon)),
    );
  });

  it('does not fetch data when isLoading is true', () => {
    const { store } = dispatchClientMetadata();

    store.dispatch(
      fetchHomeData({
        errorHandlerId: 'some-error-handler-id',
        collectionsToFetch: FEATURED_COLLECTIONS,
      }),
    );

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ store });

    sinon.assert.neverCalledWithMatch(fakeDispatch, {
      type: FETCH_HOME_DATA,
    });
  });

  it('dispatches an action to fetch the add-ons to display on update', () => {
    const enableFeatureRecommendedBadges = true;
    const includeRecommendedThemes = false;
    const includeTrendingExtensions = false;
    const { store } = dispatchClientMetadata();
    const _config = getFakeConfig({ enableFeatureRecommendedBadges });

    const fakeDispatch = sinon.stub(store, 'dispatch');

    const root = render({
      _config,
      includeRecommendedThemes,
      includeTrendingExtensions,
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
        enableFeatureRecommendedBadges,
        errorHandlerId: root.instance().props.errorHandler.id,
        collectionsToFetch: FEATURED_COLLECTIONS,
        includeRecommendedThemes,
        includeTrendingExtensions,
      }),
    );
  });

  it('does not display a collection shelf if there is no collection in state', () => {
    const { store } = dispatchClientMetadata();

    _loadHomeData({ store, collections: [null] });

    const root = render({ store });
    const shelves = root.find(LandingAddonsCard);

    const collectionShelves = shelves.find('.Home-FeaturedCollection');
    expect(collectionShelves).toHaveLength(0);
  });

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])(
    'displays an error if enableFeatureHeroRecommendation is false and clientApp is %s',
    (clientApp) => {
      const errorHandler = createStubErrorHandler(new Error('some error'));
      const { store } = dispatchClientMetadata({ clientApp });

      const root = render({
        _config: getFakeConfig({ enableFeatureHeroRecommendation: false }),
        errorHandler,
        store,
      });
      expect(root.find('.Home-noHeroError')).toHaveLength(1);
    },
  );

  it.each([true, false])(
    'displays an error if clientApp is Android and enableFeatureHeroRecommendation is %s',
    (enableFeatureHeroRecommendation) => {
      const errorHandler = createStubErrorHandler(new Error('some error'));
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      });

      const root = render({
        _config: getFakeConfig({ enableFeatureHeroRecommendation }),
        errorHandler,
        store,
      });
      expect(root.find('.Home-noHeroError')).toHaveLength(1);
    },
  );

  it('does not display an error if enableFeatureHeroRecommendation is true and clientApp is not Android', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));
    const { store } = dispatchClientMetadata({ clientApp: CLIENT_APP_FIREFOX });

    const root = render({
      _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
      errorHandler,
      store,
    });
    expect(root.find('.Home-noHeroError')).toHaveLength(0);
  });

  describe('isFeaturedCollection', () => {
    const createCollection = (details = {}) => {
      return createInternalCollection({
        detail: createFakeCollectionDetail(details),
      });
    };

    it('returns true for a featured collection', () => {
      const slug = 'privacy-matters';
      const userId = 4757633;

      const featuredCollections = [{ slug, userId }];

      const collection = createCollection({ slug, authorId: userId });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        true,
      );
    });

    it('returns false for a non-featured collection', () => {
      const featuredCollections = [
        { slug: 'privacy-matters', userId: 4757633 },
      ];

      const collection = createCollection({ slug: 'another-collection' });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        false,
      );
    });

    it('returns true for one of many featured collections', () => {
      const slug = 'privacy-matters';
      const userId = 4757633;

      const featuredCollections = [
        { slug: 'first', userId: 123 },
        { slug: 'second', userId: 456 },
        { slug, userId },
      ];

      const collection = createCollection({ slug, authorId: userId });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        true,
      );
    });

    it('returns false for a matching slug, wrong author', () => {
      const slug = 'privacy-matters';

      const featuredCollections = [{ slug, userId: 4757633 }];

      const collection = createCollection({
        slug,
        authorId: 12,
      });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        false,
      );
    });

    it('returns false for a matching author, wrong slug', () => {
      const userId = 4757633;

      const featuredCollections = [{ slug: 'privacy-matters', userId }];

      const collection = createCollection({
        slug: 'another-collection',
        authorId: userId,
      });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        false,
      );
    });
  });

  it('renders a HeadMetaTags component', () => {
    const root = render();

    expect(root.find(HeadMetaTags)).toHaveLength(1);
    expect(root.find(HeadMetaTags).prop('description')).toMatch(
      /Download Firefox extensions and themes/,
    );
  });

  it('renders HomeHeroGuides', () => {
    const root = render();

    expect(root.find(HomeHeroGuides)).toHaveLength(1);
  });

  it('renders a HeadLinks component', () => {
    const root = render();

    expect(root.find(HeadLinks)).toHaveLength(1);
  });

  describe('Hero Shelves', () => {
    it('renders when enabled', () => {
      const errorHandler = createStubErrorHandler();

      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
      });
      const heroShelves = _createHeroShelves();
      _loadHomeData({ store, heroShelves });

      const root = render({
        _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
        errorHandler,
        store,
      });

      const heroRecommendation = root.find(HeroRecommendation);
      expect(heroRecommendation).toHaveLength(1);
      expect(heroRecommendation).toHaveProp('errorHandler', errorHandler);
      expect(heroRecommendation).toHaveProp(
        'shelfData',
        createInternalHeroShelves(heroShelves).primary,
      );

      const secondaryHero = root.find(SecondaryHero);
      expect(secondaryHero).toHaveLength(1);
      expect(secondaryHero).toHaveProp(
        'shelfData',
        createInternalHeroShelves(heroShelves).secondary,
      );
    });

    it('hides the HomeHeroGuides when enabled', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
      });
      const heroShelves = _createHeroShelves();
      _loadHomeData({ store, heroShelves });

      const root = render({
        _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
        store,
      });

      expect(root.find(HomeHeroGuides)).toHaveLength(0);
    });

    it('renders even if heroShelves are not loaded', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
      });

      const root = render({
        _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
        store,
      });

      expect(root.find(HeroRecommendation)).toHaveLength(1);
      expect(root.find(SecondaryHero)).toHaveLength(1);
    });

    it('does not render when enabled on Android', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      });
      _loadHomeData({ store, heroShelves: _createHeroShelves() });

      const root = render({
        _config: getFakeConfig({ enableFeatureHeroRecommendation: true }),
        store,
      });

      expect(root.find(HeroRecommendation)).toHaveLength(0);
      expect(root.find(SecondaryHero)).toHaveLength(0);
    });

    it('does not render when disabled', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
      });
      _loadHomeData({ store, heroShelves: _createHeroShelves() });

      const root = render({
        _config: getFakeConfig({ enableFeatureHeroRecommendation: false }),
        store,
      });

      expect(root.find(HeroRecommendation)).toHaveLength(0);
      expect(root.find(SecondaryHero)).toHaveLength(0);
    });
  });

  describe('getFeaturedCollectionsMetadata', () => {
    it('exposes a `footerText` prop', () => {
      const metadata = getFeaturedCollectionsMetadata(fakeI18n());

      expect(metadata[0]).toHaveProperty('footerText');
    });

    it('exposes a `header` prop', () => {
      const metadata = getFeaturedCollectionsMetadata(fakeI18n());

      expect(metadata[0]).toHaveProperty('header');
    });

    it('exposes a `slug` prop', () => {
      const metadata = getFeaturedCollectionsMetadata(fakeI18n());

      expect(metadata[0]).toHaveProperty('slug');
    });

    it('exposes a `userId` prop', () => {
      const metadata = getFeaturedCollectionsMetadata(fakeI18n());

      expect(metadata[0]).toHaveProperty('userId');
    });

    it('exposes a `isTheme` prop', () => {
      const metadata = getFeaturedCollectionsMetadata(fakeI18n());

      expect(metadata[0]).toHaveProperty('isTheme');
    });
  });
});
