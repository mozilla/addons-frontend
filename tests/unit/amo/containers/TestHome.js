import { shallow } from 'enzyme';
import React from 'react';

import {
  CategoryLink,
  ExtensionLink,
  HomeBase,
  ThemeLink,
  mapStateToProps,
} from 'amo/components/Home';
import HomeCarousel from 'amo/components/HomeCarousel';
import Link from 'amo/components/Link';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { fakeI18n } from 'tests/unit/helpers';


describe('Home', () => {
  function render(props) {
    const fakeDispatch = sinon.stub();

    return shallow(
      <HomeBase
        clientApp={CLIENT_APP_FIREFOX}
        dispatch={fakeDispatch}
        i18n={fakeI18n()}
        {...props}
      />
    );
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
    const root = render({ clientApp: CLIENT_APP_ANDROID });
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
    const { state } = dispatchSignInActions({ clientApp: CLIENT_APP_ANDROID });

    expect(mapStateToProps(state).clientApp).toEqual(CLIENT_APP_ANDROID);
  });
});
