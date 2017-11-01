import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
  FEATURED_COLLECTION_SLUG,
  FEATURED_COLLECTION_USER,
  HomeBase,
} from 'amo/components/Home';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { fetchHomeAddons, loadHomeAddons } from 'amo/reducers/home';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TRENDING,
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
    const store = dispatchClientMetadata().store;

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

  it('renders a popular extensions shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-PopularExtensions');
    expect(shelf).toHaveProp('header', 'Most Popular Extensions');
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

  it('renders a featured collection shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedCollection');
    expect(shelf).toHaveProp('header', 'Change up your tabs');
    expect(shelf).toHaveProp('footerText', 'See more tab extensions');
    expect(shelf).toHaveProp('footerLink', { pathname:
      `/collections/${FEATURED_COLLECTION_USER}/${FEATURED_COLLECTION_SLUG}/`,
    });
    expect(shelf).toHaveProp('loading', true);
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

  it('renders a up and coming extensions shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-UpAndComingExtensions');
    expect(shelf).toHaveProp('header', 'Up & Coming Extensions');
    expect(shelf).toHaveProp('footerText', 'See more up & coming extensions');
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
    expect(shelf.find('.Home-SubjectShelf-list-item'))
      .toHaveLength(expectedThemes.length);
    expectedThemes.forEach((slug) => {
      expect(shelf.find({ to: `/themes/${slug}/` })).toHaveLength(1);
    });
  });

  it('dispatches an action to fetch the add-ons to display', () => {
    const errorHandler = createStubErrorHandler();
    const store = dispatchClientMetadata().store;

    const fakeDispatch = sinon.stub(store, 'dispatch');
    render({ errorHandler, store });

    sinon.assert.callCount(fakeDispatch, 2);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));
    sinon.assert.calledWith(fakeDispatch, fetchHomeAddons({
      errorHandlerId: errorHandler.id,
      featuredCollectionSlug: FEATURED_COLLECTION_SLUG,
      featuredCollectionUser: FEATURED_COLLECTION_USER,
    }));
  });

  it('does not fetch the add-ons when results are already loaded', () => {
    const store = dispatchClientMetadata().store;

    const addons = [{ ...fakeAddon, slug: 'popular-addon' }];
    const themes = [{ ...fakeTheme }];
    const featuredCollection = createFakeCollectionAddons({ addons });
    const featuredThemes = createAddonsApiResult(themes);
    const popularExtensions = createAddonsApiResult(addons);
    const upAndComingExtensions = createAddonsApiResult(addons);

    store.dispatch(loadHomeAddons({
      featuredCollection,
      featuredThemes,
      popularExtensions,
      upAndComingExtensions,
    }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));

    const shelves = root.find(LandingAddonsCard);
    expect(shelves).toHaveLength(4);

    const popularExtensionsShelf = shelves.find('.Home-PopularExtensions');
    expect(popularExtensionsShelf).toHaveProp('loading', false);
    expect(popularExtensionsShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const featuredCollectionShelf = shelves.find('.Home-FeaturedCollection');
    expect(featuredCollectionShelf).toHaveProp('loading', false);
    expect(featuredCollectionShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const featuredThemesShelf = shelves.find('.Home-FeaturedThemes');
    expect(featuredThemesShelf).toHaveProp('loading', false);
    expect(featuredThemesShelf)
      .toHaveProp('addons', themes.map((addon) => createInternalAddon(addon)));

    const upAndComingExtensionsShelf = shelves
      .find('.Home-UpAndComingExtensions');
    expect(upAndComingExtensionsShelf).toHaveProp('loading', false);
    expect(upAndComingExtensionsShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));
  });

  it('displays an error if present', () => {
    const store = dispatchClientMetadata().store;

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
