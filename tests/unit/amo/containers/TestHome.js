import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
  FIRST_COLLECTION_SLUG,
  FIRST_COLLECTION_USER,
  HomeBase,
} from 'amo/components/Home';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { fetchHomeAddons, loadHomeAddons } from 'amo/reducers/home';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_EXTENSION,
  SEARCH_SORT_POPULAR,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import ErrorList from 'ui/components/ErrorList';
import {
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createAddonsApiResult,
  createFakeCollectionAddons,
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

    expect(shelf).toHaveProp('header', 'Media downloaders');
    expect(shelf).toHaveProp('footerText', 'See more media downloaders');
    expect(shelf).toHaveProp('footerLink', { pathname:
      `/collections/${FIRST_COLLECTION_USER}/${FIRST_COLLECTION_SLUG}/`,
    });
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
    expect(shelf.find('.Home-SubjectShelf-list-item'))
      .toHaveLength(expectedCollections.length);
    expectedCollections.forEach((collectionSlug) => {
      expect(shelf.find({ to: `/collections/mozilla/${collectionSlug}/` }))
        .toHaveLength(1);
    });
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
    expect(shelf.find('.Home-SubjectShelf-list-item'))
      .toHaveLength(expectedThemes.length);
    expectedThemes.forEach((slug) => {
      expect(shelf.find({ to: `/themes/${slug}/` })).toHaveLength(1);
    });
  });

  it('renders a comment for monitoring', () => {
    const root = render();
    expect(root.find('.do-not-remove').html())
      .toContain('<!-- Godzilla of browsers -->');
  });

  it('dispatches an action to fetch the add-ons to display', () => {
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(fakeDispatch, fetchHomeAddons({
      errorHandlerId: errorHandler.id,
      firstCollectionSlug: FIRST_COLLECTION_SLUG,
      firstCollectionUser: FIRST_COLLECTION_USER,
    }));
  });

  it('does not fetch the add-ons when results are already loaded', () => {
    const { store } = dispatchClientMetadata();

    const addons = [{ ...fakeAddon, slug: 'addon' }];
    const themes = [{ ...fakeTheme }];

    const firstCollection = createFakeCollectionAddons({ addons });
    const featuredExtensions = createAddonsApiResult(addons);
    const featuredThemes = createAddonsApiResult(themes);
    const popularExtensions = createAddonsApiResult(addons);
    const topRatedExtensions = createAddonsApiResult(themes);

    store.dispatch(loadHomeAddons({
      firstCollection,
      featuredExtensions,
      featuredThemes,
      popularExtensions,
      topRatedExtensions,
    }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));

    const shelves = root.find(LandingAddonsCard);
    expect(shelves).toHaveLength(5);

    const firstCollectionShelf = shelves.find('.Home-FeaturedCollection')
      .at(0);
    expect(firstCollectionShelf).toHaveProp('loading', false);
    expect(firstCollectionShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const featuredExtensionsShelf = shelves.find('.Home-FeaturedExtensions');
    expect(featuredExtensionsShelf).toHaveProp('loading', false);
    expect(featuredExtensionsShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const featuredThemesShelf = shelves.find('.Home-FeaturedThemes');
    expect(featuredThemesShelf).toHaveProp('loading', false);
    expect(featuredThemesShelf)
      .toHaveProp('addons', themes.map((theme) => createInternalAddon(theme)));

    const popularExtensionsShelf = shelves.find('.Home-PopularExtensions');
    expect(popularExtensionsShelf).toHaveProp('loading', false);
    expect(popularExtensionsShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const topRatedExtensionsShelf = shelves
      .find('.Home-TopRatedExtensions');
    expect(topRatedExtensionsShelf).toHaveProp('loading', false);
    expect(topRatedExtensionsShelf)
      .toHaveProp('addons', themes.map((theme) => createInternalAddon(theme)));
  });

  it('displays an error if present', () => {
    const { store } = dispatchClientMetadata();

    const errorHandler = new ErrorHandler({
      id: 'some-error-handler-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(createApiError({
      response: { status: 500 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'Nope.' },
    }));

    const root = render({ errorHandler, store });
    expect(root.find(ErrorList)).toHaveLength(1);
  });
});
