import * as React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
  COLLECTIONS_TO_FETCH,
  HomeBase,
} from 'amo/components/Home';
import HomeHeroBanner from 'amo/components/HomeHeroBanner';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import { fetchHomeAddons, loadHomeAddons } from 'amo/reducers/home';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
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
  createFakeCollectionAddonsListResponse,
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

    expect(shelf).toHaveProp('header', 'Tame your tabs');
    expect(shelf).toHaveProp('footerText', 'See more tab extensions');
    expect(shelf).toHaveProp('footerLink',
      `/collections/${COLLECTIONS_TO_FETCH[0].user}/${COLLECTIONS_TO_FETCH[0].slug}/`
    );
    expect(shelf).toHaveProp('loading', true);
  });

  it('renders a second featured collection shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedCollection').at(1);

    expect(shelf).toHaveProp('header', 'Essential extensions');
    expect(shelf).toHaveProp('footerText',
      'See more essential extensions');
    expect(shelf).toHaveProp('footerLink',
      `/collections/${COLLECTIONS_TO_FETCH[1].user}/${COLLECTIONS_TO_FETCH[1].slug}/`
    );
    expect(shelf).toHaveProp('loading', true);
  });

  it('renders a third featured collection shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedCollection').at(2);

    expect(shelf).toHaveProp('header', 'Translation tools');
    expect(shelf).toHaveProp('footerText',
      'See more translation tools');
    expect(shelf).toHaveProp('footerLink',
      `/collections/${COLLECTIONS_TO_FETCH[2].user}/${COLLECTIONS_TO_FETCH[2].slug}/`
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
    expect(shelf.find('.Home-SubjectShelf-list-item'))
      .toHaveLength(expectedCollections.length);
    expectedCollections.forEach((collectionSlug) => {
      expect(shelf.find({ to: `/collections/mozilla/${collectionSlug}/` }))
        .toHaveLength(1);
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
      collectionsToFetch: COLLECTIONS_TO_FETCH,
    }));
  });

  it('does not fetch the add-ons when results are already loaded', () => {
    const { store } = dispatchClientMetadata();

    const addons = [{ ...fakeAddon, slug: 'addon' }];
    const themes = [{ ...fakeTheme }];

    const collections = [
      createFakeCollectionAddonsListResponse({ addons }),
      createFakeCollectionAddonsListResponse({ addons }),
    ];
    const featuredExtensions = createAddonsApiResult(addons);
    const featuredThemes = createAddonsApiResult(themes);

    store.dispatch(loadHomeAddons({
      collections,
      featuredExtensions,
      featuredThemes,
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

    const secondCollectionShelf = shelves.find('.Home-FeaturedCollection')
      .at(1);
    expect(secondCollectionShelf).toHaveProp('loading', false);
    expect(secondCollectionShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const featuredExtensionsShelf = shelves.find('.Home-FeaturedExtensions');
    expect(featuredExtensionsShelf).toHaveProp('loading', false);
    expect(featuredExtensionsShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const featuredThemesShelf = shelves.find('.Home-FeaturedThemes');
    expect(featuredThemesShelf).toHaveProp('loading', false);
    expect(featuredThemesShelf)
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
