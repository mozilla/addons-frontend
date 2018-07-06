import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
  FEATURED_COLLECTIONS,
  HomeBase,
  isFeaturedCollection,
} from 'amo/components/Home';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { fetchHomeAddons, loadHomeAddons } from 'amo/reducers/home';
import { createInternalCollection } from 'amo/reducers/collections';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  ADDON_TYPE_THEMES_FILTER,
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
  fakeTheme,
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

  it('renders a first featured collection shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedCollection').at(0);

    expect(shelf).toHaveProp('header', 'Translation tools');
    expect(shelf).toHaveProp('footerText', 'See more translation tools');
    expect(shelf).toHaveProp(
      'footerLink',
      `/collections/${FEATURED_COLLECTIONS[0].username}/${
        FEATURED_COLLECTIONS[0].slug
      }/`,
    );
    expect(shelf).toHaveProp('loading', true);
  });

  it('renders a second featured collection shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedCollection').at(1);

    expect(shelf).toHaveProp('header', 'Privacy matters');
    expect(shelf).toHaveProp('footerText', 'See more privacy extensions');
    expect(shelf).toHaveProp(
      'footerLink',
      `/collections/${FEATURED_COLLECTIONS[1].username}/${
        FEATURED_COLLECTIONS[1].slug
      }/`,
    );
    expect(shelf).toHaveProp('loading', true);
  });

  it('renders a third featured collection shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedCollection').at(2);

    expect(shelf).toHaveProp('header', 'Tame your tabs');
    expect(shelf).toHaveProp('footerText', 'See more tab extensions');
    expect(shelf).toHaveProp(
      'footerLink',
      `/collections/${FEATURED_COLLECTIONS[2].username}/${
        FEATURED_COLLECTIONS[2].slug
      }/`,
    );
    expect(shelf).toHaveProp('loading', true);
  });

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

  it('renders a featured themes shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedThemes');
    expect(shelf).toHaveProp('header', 'Featured themes');
    expect(shelf).toHaveProp('footerText', 'See more featured themes');
    expect(shelf).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_THEME,
        featured: true,
      },
    });
    expect(shelf).toHaveProp('loading', true);
  });

  it('renders a featured themes shelf with the ADDON_TYPE_THEMES_FILTER filter if static theme is enabled', () => {
    const fakeConfig = getFakeConfig({ enableStaticThemes: true });
    const root = render({ _config: fakeConfig });

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedThemes');

    expect(shelf.at(0)).toHaveProp('footerLink');
    expect(shelf.at(0).props().footerLink.query.addonType).toEqual(
      ADDON_TYPE_THEMES_FILTER,
    );
  });

  it('renders a featured themes shelf with the ADDON_TYPE_THEME filter if static theme is disabled', () => {
    const fakeConfig = getFakeConfig({ enableStaticThemes: false });
    const root = render({ _config: fakeConfig });

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedThemes');

    expect(shelf.at(0)).toHaveProp('footerLink');
    expect(shelf.at(0).props().footerLink.query.addonType).toEqual(
      ADDON_TYPE_THEME,
    );
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
      }),
    );
  });

  it('does not fetch the add-ons when results are already loaded', () => {
    const { store } = dispatchClientMetadata();

    const addons = [{ ...fakeAddon, slug: 'addon' }];
    const collectionAddons = createFakeCollectionAddons();
    const themes = [{ ...fakeTheme }];

    const collections = [
      createFakeCollectionAddonsListResponse({ addons: collectionAddons }),
      createFakeCollectionAddonsListResponse({ addons: collectionAddons }),
      createFakeCollectionAddonsListResponse({ addons: collectionAddons }),
    ];
    const featuredExtensions = createAddonsApiResult(addons);
    const featuredThemes = createAddonsApiResult(themes);

    store.dispatch(
      loadHomeAddons({
        collections,
        featuredExtensions,
        featuredThemes,
      }),
    );

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));

    const shelves = root.find(LandingAddonsCard);
    expect(shelves).toHaveLength(5);

    const firstCollectionShelf = shelves.find('.Home-FeaturedCollection').at(0);
    expect(firstCollectionShelf).toHaveProp('loading', false);
    expect(firstCollectionShelf).toHaveProp(
      'addons',
      collectionAddons.map((addon) => createInternalAddon(addon.addon)),
    );

    const secondCollectionShelf = shelves
      .find('.Home-FeaturedCollection')
      .at(1);
    expect(secondCollectionShelf).toHaveProp('loading', false);
    expect(secondCollectionShelf).toHaveProp(
      'addons',
      collectionAddons.map((addon) => createInternalAddon(addon.addon)),
    );

    const thirdCollectionShelf = shelves.find('.Home-FeaturedCollection').at(2);
    expect(thirdCollectionShelf).toHaveProp('loading', false);
    expect(thirdCollectionShelf).toHaveProp(
      'addons',
      collectionAddons.map((addon) => createInternalAddon(addon.addon)),
    );

    const featuredExtensionsShelf = shelves.find('.Home-FeaturedExtensions');
    expect(featuredExtensionsShelf).toHaveProp('loading', false);
    expect(featuredExtensionsShelf).toHaveProp(
      'addons',
      addons.map((addon) => createInternalAddon(addon)),
    );

    const featuredThemesShelf = shelves.find('.Home-FeaturedThemes');
    expect(featuredThemesShelf).toHaveProp('loading', false);
    expect(featuredThemesShelf).toHaveProp(
      'addons',
      themes.map((theme) => createInternalAddon(theme)),
    );
  });

  it('does not display a collection shelf if there is no collection in state', () => {
    const { store } = dispatchClientMetadata();

    const addons = [{ ...fakeAddon, slug: 'addon' }];
    const themes = [{ ...fakeTheme }];

    const collections = [null, null, null];
    const featuredExtensions = createAddonsApiResult(addons);
    const featuredThemes = createAddonsApiResult(themes);

    store.dispatch(
      loadHomeAddons({
        collections,
        featuredExtensions,
        featuredThemes,
      }),
    );

    const root = render({ store });

    const shelves = root.find(LandingAddonsCard);
    expect(shelves).toHaveLength(2);

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
});
