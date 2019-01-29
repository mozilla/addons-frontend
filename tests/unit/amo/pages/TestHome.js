import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
  FEATURED_COLLECTIONS,
  MOZILLA_USER_ID,
  HomeBase,
  getFeaturedCollectionsMetadata,
  isFeaturedCollection,
} from 'amo/pages/Home';
import FeaturedCollectionCard from 'amo/components/FeaturedCollectionCard';
import HomeHeroGuides from 'amo/components/HomeHeroGuides';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { fetchHomeAddons, loadHomeAddons } from 'amo/reducers/home';
import { createInternalCollection } from 'amo/reducers/collections';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEMES_FILTER,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TRENDING,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import ErrorList from 'ui/components/ErrorList';
import {
  createAddonsApiResult,
  createFakeCollectionAddons,
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
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
      expect(shelf).toHaveProp('isTheme', collectionMetadata.isTheme);
    },
  );

  it('renders a featured extensions shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedExtensions');
    expect(shelf).toHaveProp('header', 'Featured extensions');
    expect(shelf).toHaveProp('footerText', 'See more featured extensions');
    expect(shelf).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        featured: true,
      },
    });
    expect(shelf).toHaveProp('loading', true);
  });

  it('renders a shelf with curated collections', () => {
    const expectedCollections = [
      'ad-blockers',
      'password-managers',
      'bookmark-managers',
      'smarter-shopping',
      'be-more-productive',
      'watching-videos',
    ];

    const root = render();

    const shelf = root.find('.Home-CuratedCollections');
    expect(shelf.find('.Home-SubjectShelf-text-wrapper')).toHaveLength(1);
    expect(shelf.find('.Home-SubjectShelf-list-item')).toHaveLength(
      expectedCollections.length,
    );
    expectedCollections.forEach((collectionSlug) => {
      expect(
        shelf.find({
          to: `/collections/${MOZILLA_USER_ID}/${collectionSlug}/`,
        }),
      ).toHaveLength(1);
    });
  });

  it('renders a featured themes shelf if includeFeaturedThemes is true', () => {
    const root = render({ includeFeaturedThemes: true });

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedThemes');
    expect(shelf).toHaveProp('header', 'Featured themes');
    expect(shelf).toHaveProp('footerText', 'See more featured themes');
    expect(shelf).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        featured: true,
      },
    });
    expect(shelf).toHaveProp('loading', true);
    expect(shelf).toHaveProp('isTheme', true);
  });

  it('does not render a featured themes shelf if includeFeaturedThemes is false', () => {
    const root = render({ includeFeaturedThemes: false });

    const shelves = root.find(LandingAddonsCard);
    expect(shelves.find('.Home-FeaturedThemes')).toHaveLength(0);
  });

  it('renders a popular extensions shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-PopularAddons');
    expect(shelf).toHaveProp('header', 'Popular themes');
    expect(shelf).toHaveProp('footerText', 'See more popular themes');
    expect(shelf).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_THEMES_FILTER,
        sort: SEARCH_SORT_POPULAR,
      },
    });
    expect(shelf).toHaveProp('loading', true);
  });

  it('does not render a trending extensions shelf if includeTrendingExtensions is false', () => {
    const root = render({ includeTrendingExtensions: false });

    const shelves = root.find(LandingAddonsCard);
    expect(shelves.find('.Home-TrendingExtensions')).toHaveLength(0);
  });

  it('renders a trending extensions shelf when includeTrendingExtensions is true', () => {
    const root = render({ includeTrendingExtensions: true });

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-TrendingExtensions');
    expect(shelf).toHaveProp('header', 'Trending extensions');
    expect(shelf).toHaveProp('footerText', 'See more trending extensions');
    expect(shelf).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        sort: SEARCH_SORT_TRENDING,
      },
    });
    expect(shelf).toHaveProp('loading', true);
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
      expect(shelf.find({ to: `/themes/${slug}/` })).toHaveLength(1);
    });
  });

  it('renders a comment for monitoring', () => {
    const root = render();
    expect(root.find('.do-not-remove').html()).toContain(
      '<!-- Godzilla of browsers -->',
    );
  });

  it('dispatches an action to fetch the add-ons to display', () => {
    const includeFeaturedThemes = false;
    const includeTrendingExtensions = false;
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      includeFeaturedThemes,
      includeTrendingExtensions,
      store,
    });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeAddons({
        errorHandlerId: errorHandler.id,
        collectionsToFetch: FEATURED_COLLECTIONS,
        includeFeaturedThemes,
        includeTrendingExtensions,
      }),
    );
  });

  // This test case should be updated when we change the `defaultProps`.
  it('fetches add-ons with some defaults', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeAddons({
        errorHandlerId: errorHandler.id,
        collectionsToFetch: FEATURED_COLLECTIONS,
        includeFeaturedThemes: false,
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
    const featuredExtensions = createAddonsApiResult(addons);

    store.dispatch(
      loadHomeAddons({
        collections,
        shelves: { featuredExtensions },
      }),
    );

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ includeFeaturedThemes: false, store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));

    const firstCollectionShelf = root.find('.Home-FeaturedCollection');
    expect(firstCollectionShelf).toHaveProp('loading', false);
    expect(firstCollectionShelf).toHaveProp(
      'addons',
      collectionAddons.map((addon) => createInternalAddon(addon.addon)),
    );

    const featuredExtensionsShelf = root.find('.Home-FeaturedExtensions');
    expect(featuredExtensionsShelf).toHaveProp('loading', false);
    expect(featuredExtensionsShelf).toHaveProp(
      'addons',
      addons.map((addon) => createInternalAddon(addon)),
    );
  });

  it('dispatches an action to fetch the add-ons to display on update', () => {
    const includeFeaturedThemes = false;
    const includeTrendingExtensions = false;
    const { store } = dispatchClientMetadata();

    const fakeDispatch = sinon.stub(store, 'dispatch');

    const root = render({
      includeFeaturedThemes,
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
      fetchHomeAddons({
        errorHandlerId: root.instance().props.errorHandler.id,
        collectionsToFetch: FEATURED_COLLECTIONS,
        includeFeaturedThemes,
        includeTrendingExtensions,
      }),
    );
  });

  it('does not display a collection shelf if there is no collection in state', () => {
    const { store } = dispatchClientMetadata();

    const addons = [{ ...fakeAddon, slug: 'addon' }];

    const collections = [null, null, null];
    const featuredExtensions = createAddonsApiResult(addons);

    store.dispatch(
      loadHomeAddons({
        collections,
        shelves: { featuredExtensions },
      }),
    );

    const root = render({ store });
    const shelves = root.find(LandingAddonsCard);

    const collectionShelves = shelves.find('.Home-FeaturedCollection');
    expect(collectionShelves).toHaveLength(0);
  });

  it('displays an error if present', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(
      createApiError({
        response: { status: 500 },
        apiURL: 'https://some/api/endpoint',
        jsonResponse: { message: 'Nope.' },
      }),
    );

    const root = render({ errorHandler, store });
    expect(root.find(ErrorList)).toHaveLength(1);
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
});
