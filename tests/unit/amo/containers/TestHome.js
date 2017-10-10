import { shallow } from 'enzyme';
import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
  FEATURED_COLLECTION_SLUG,
  FEATURED_COLLECTION_USER,
  CategoryLink,
  ExtensionLink,
  HomeBase,
  ThemeLink,
  mapStateToProps,
} from 'amo/components/Home';
import HomeCarousel from 'amo/components/HomeCarousel';
import LandingAddonsCard from 'amo/components/LandingAddonsCard';
import Link from 'amo/components/Link';
import { fetchHomeAddons, loadHomeAddons } from 'amo/reducers/home';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
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
    const store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    }).store;

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

    expect(root.find(HomeCarousel)).toHaveLength(1);
  });

  it('renders headings', () => {
    const root = render();

    expect(
      root.find('.Home-category-card--extensions .Home-subheading')
    ).toIncludeText('You can change how Firefox works…');
    expect(
      root.find('.Home-category-card--themes .Home-subheading')
    ).toIncludeText('…or what it looks like');
  });

  it('renders add-on type descriptions', () => {
    const root = render();

    expect(
      root.find('.Home-category-card--extensions .Home-description')
    ).toIncludeText('Explore powerful tools and features to customize');
    expect(
      root.find('.Home-category-card--themes .Home-description')
    ).toIncludeText("Change your browser's appearance.");
  });

  it('renders Firefox URLs for categories', () => {
    const root = render({ clientApp: CLIENT_APP_FIREFOX });
    const links = shallow(root.instance().extensionsCategoriesForClientApp());

    expect(links.find(ExtensionLink).find('[name="block-ads"]'))
      .toHaveProp('slug', 'privacy-security');
  });

  it('renders Android URLs for categories', () => {
    const store = dispatchClientMetadata({
      clientApp: CLIENT_APP_ANDROID,
    }).store;

    const root = render({ store });
    const links = shallow(root.instance().extensionsCategoriesForClientApp());

    expect(links.find(ExtensionLink).find('[name="block-ads"]'))
      .toHaveProp('slug', 'security-privacy');
  });

  it('renders an ExtensionLink', () => {
    const root = shallow(
      <ExtensionLink name="scenic" slug="test">Hello</ExtensionLink>
    );

    expect(root.find(CategoryLink)).toHaveProp('children', 'Hello');
    expect(root.find(CategoryLink)).toHaveProp('name', 'scenic');
    expect(root.find(CategoryLink)).toHaveProp('slug', 'test');
    expect(root.find(CategoryLink)).toHaveProp('type', 'extensions');
  });

  it('renders a ThemeLink', () => {
    const root = shallow(
      <ThemeLink name="scenic" slug="test">Hello</ThemeLink>
    );

    expect(root.find(CategoryLink)).toHaveProp('children', 'Hello');
    expect(root.find(CategoryLink)).toHaveProp('name', 'scenic');
    expect(root.find(CategoryLink)).toHaveProp('slug', 'test');
    expect(root.find(CategoryLink)).toHaveProp('type', 'themes');
  });

  it('renders a CategoryLink', () => {
    const root = shallow(
      <CategoryLink name="scenic" slug="test" type="themes" />
    );

    expect(root.find(Link)).toHaveProp('to', '/themes/test/');
  });

  it('maps clientApp to props from state', () => {
    const { state } = dispatchClientMetadata({ clientApp: CLIENT_APP_ANDROID });

    expect(mapStateToProps(state).clientApp).toEqual(CLIENT_APP_ANDROID);
  });

  it('renders a trending extensions shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-TrendingExtensions');
    expect(shelf).toHaveProp('header', 'Trending extensions');
    expect(shelf).toHaveProp('footerText', 'More trending extensions');
    expect(shelf).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        sort: SEARCH_SORT_TRENDING,
      },
    });
    expect(shelf).toHaveProp('loading', true);
  });

  it('renders a featured themes shelf', () => {
    const root = render();

    const shelves = root.find(LandingAddonsCard);
    const shelf = shelves.find('.Home-FeaturedThemes');
    expect(shelf).toHaveProp('header', 'Featured themes');
    expect(shelf).toHaveProp('footerText', 'More featured themes');
    expect(shelf).toHaveProp('footerLink', { pathname: '/themes/featured/' });
    expect(shelf).toHaveProp('loading', true);
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

    const addons = [{ ...fakeAddon, slug: 'trending-addon' }];
    const themes = [{ ...fakeTheme }];
    const featuredCollection = createFakeCollectionAddons({ addons });
    const featuredThemes = createAddonsApiResult(themes);
    const trendingExtensions = createAddonsApiResult(addons);

    store.dispatch(loadHomeAddons({
      featuredCollection,
      featuredThemes,
      trendingExtensions,
    }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));

    const shelves = root.find(LandingAddonsCard);
    expect(shelves).toHaveLength(3);

    const trendingExtensionsShelf = shelves.find('.Home-TrendingExtensions');
    expect(trendingExtensionsShelf).toHaveProp('loading', false);
    expect(trendingExtensionsShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const featuredCollectionShelf = shelves.find('.Home-FeaturedCollection');
    expect(featuredCollectionShelf).toHaveProp('loading', false);
    expect(featuredCollectionShelf)
      .toHaveProp('addons', addons.map((addon) => createInternalAddon(addon)));

    const featuredThemesShelf = shelves.find('.Home-FeaturedThemes');
    expect(featuredThemesShelf).toHaveProp('loading', false);
    expect(featuredThemesShelf)
      .toHaveProp('addons', themes.map((addon) => createInternalAddon(addon)));
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
