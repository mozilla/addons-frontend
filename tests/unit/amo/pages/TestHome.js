import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
  FEATURED_COLLECTIONS,
  HomeBase,
  getFeaturedCollectionsMetadata,
  isFeaturedCollection,
} from 'amo/pages/Home';
import FeaturedCollectionCard from 'amo/components/FeaturedCollectionCard';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { fetchHomeAddons, loadHomeAddons } from 'amo/reducers/home';
import { createInternalCollection } from 'amo/reducers/collections';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEMES_FILTER,
  SEARCH_SORT_POPULAR,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import ErrorList from 'ui/components/ErrorList';
import {
  createStubErrorHandler,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createAddonsApiResult,
  createFakeCollectionAddons,
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';

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

  it('renders a carousel', () => {
    const root = render();

    expect(root.find(HomeHeroBanner)).toHaveLength(1);
  });

  it.each([0, 1])(
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
      expect(shelf).toHaveProp('username', collectionMetadata.username);
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
        shelf.find({ to: `/collections/mozilla/${collectionSlug}/` }),
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
    const shelf = shelves.find('.Home-PopularExtensions');
    expect(shelf).toHaveProp('header', 'Popular extensions');
    expect(shelf).toHaveProp('footerText', 'See more popular extensions');
    expect(shelf).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        sort: SEARCH_SORT_POPULAR,
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
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, includeFeaturedThemes, store });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(
      fakeDispatch,
      fetchHomeAddons({
        errorHandlerId: errorHandler.id,
        collectionsToFetch: FEATURED_COLLECTIONS,
        includeFeaturedThemes,
      }),
    );
  });

  it('includes featured themes by default', () => {
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
        includeFeaturedThemes: true,
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
    const popularExtensions = createAddonsApiResult(addons);

    store.dispatch(
      loadHomeAddons({
        collections,
        featuredExtensions,
        featuredThemes: null,
        popularExtensions,
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

  it('does not display a collection shelf if there is no collection in state', () => {
    const { store } = dispatchClientMetadata();

    const addons = [{ ...fakeAddon, slug: 'addon' }];

    const collections = [null, null, null];
    const featuredExtensions = createAddonsApiResult(addons);
    const featuredThemes = createAddonsApiResult([]);
    const popularExtensions = createAddonsApiResult(addons);

    store.dispatch(
      loadHomeAddons({
        collections,
        featuredExtensions,
        featuredThemes,
        popularExtensions,
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
        items: createFakeCollectionAddons(),
      });
    };

    it('returns true for a featured collection', () => {
      const slug = 'privacy-matters';
      const username = 'mozilla';

      const featuredCollections = [{ slug, username }];

      const collection = createCollection({ slug, authorUsername: username });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        true,
      );
    });

    it('returns false for a non-featured collection', () => {
      const featuredCollections = [
        { slug: 'privacy-matters', username: 'mozilla' },
      ];

      const collection = createCollection({ slug: 'another-collection' });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        false,
      );
    });

    it('returns true for one of many featured collections', () => {
      const slug = 'privacy-matters';
      const username = 'mozilla';

      const featuredCollections = [
        { slug: 'first', username: 'first-author' },
        { slug: 'second', username: 'second-author' },
        { slug, username },
      ];

      const collection = createCollection({ slug, authorUsername: username });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        true,
      );
    });

    it('returns false for a matching slug, wrong author', () => {
      const slug = 'privacy-matters';

      const featuredCollections = [{ slug, username: 'mozilla' }];

      const collection = createCollection({
        slug,
        authorUsername: 'another-author',
      });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        false,
      );
    });

    it('returns false for a matching author, wrong slug', () => {
      const username = 'mozilla';

      const featuredCollections = [{ slug: 'privacy-matters', username }];

      const collection = createCollection({
        slug: 'another-collection',
        authorUsername: username,
      });

      expect(isFeaturedCollection(collection, { featuredCollections })).toEqual(
        false,
      );
    });
  });

  it('renders a canonical link tag', () => {
    const baseURL = 'https://example.org';
    const _config = getFakeConfig({ baseURL });

    const pathname = '/some-landing-pathname/';
    const { store } = dispatchClientMetadata({ pathname });

    const root = render({ _config, store });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp(
      'href',
      `${baseURL}${pathname}`,
    );
  });
});
