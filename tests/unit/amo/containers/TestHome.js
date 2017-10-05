import { shallow } from 'enzyme';
import React from 'react';

import { setViewContext } from 'amo/actions/viewContext';
import Home, {
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
import {
  ADDON_TYPE_EXTENSION,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  SEARCH_SORT_POPULAR,
  VIEW_CONTEXT_HOME,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createStubErrorHandler,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createAddonsApiResult,
  dispatchClientMetadata,
  fakeAddon,
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

  it('renders a popular extensions shelf', () => {
    const root = render();

    const shelf = root.find(LandingAddonsCard);
    expect(shelf).toHaveLength(1);
    expect(shelf).toHaveProp('header', 'Most popular extensions');
    expect(shelf).toHaveProp('footerText', 'More popular extensions');
    expect(shelf).toHaveProp('footerLink', {
      pathname: '/search/',
      query: {
        addonType: ADDON_TYPE_EXTENSION,
        sort: SEARCH_SORT_POPULAR,
      },
    });
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
    }));
  });

  it('does not fetch the add-ons when results are already loaded', () => {
    const store = dispatchClientMetadata().store;

    const addons = [{ ...fakeAddon, slug: 'popular-addon' }];
    const popularExtensions = createAddonsApiResult(addons);

    store.dispatch(loadHomeAddons({
      popularExtensions,
    }));

    const fakeDispatch = sinon.stub(store, 'dispatch');
    const root = render({ store });

    sinon.assert.callCount(fakeDispatch, 1);
    sinon.assert.calledWith(fakeDispatch, setViewContext(VIEW_CONTEXT_HOME));

    const shelf = root.find(LandingAddonsCard);
    expect(shelf).toHaveProp('loading', false);
    expect(shelf).toHaveProp('addons', addons.map((addon) => (
      createInternalAddon(addon)
    )));
  });
});
