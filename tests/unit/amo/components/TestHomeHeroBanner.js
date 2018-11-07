import * as React from 'react';
import { shallow } from 'enzyme';

import HomeHeroBanner, {
  AB_HOME_HERO_EXPERIMENT,
  AB_HOME_HERO_VARIANT_A,
  AB_HOME_HERO_VARIANT_B,
  HomeHeroBannerBase,
} from 'amo/components/HomeHeroBanner';
import { INSTALL_SOURCE_HERO_PROMO } from 'core/constants';
import Hero from 'ui/components/Hero';
import {
  dispatchClientMetadata,
  fakeCookies,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

// Skip `withCookies` HOC since Enzyme does not support the React Context API.
// See: https://github.com/mozilla/addons-frontend/issues/6839
jest.mock('react-cookie', () => ({
  withCookies: (component) => component,
}));

describe(__filename, () => {
  const defaultProps = {
    _config: getFakeConfig({
      experiments: {
        [AB_HOME_HERO_EXPERIMENT]: true,
      },
    }),
    cookies: fakeCookies(),
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
  };

  function render(props) {
    return shallowUntilTarget(
      <HomeHeroBanner {...defaultProps} {...props} />,
      HomeHeroBannerBase,
    );
  }

  it('renders a HomeHeroBanner', () => {
    const root = render();
    expect(root).toHaveClassName('HomeHeroBanner');
  });

  it('renders with the "small" experiment classname', () => {
    const root = render({ variant: AB_HOME_HERO_VARIANT_A });
    expect(root).toHaveClassName('HomeHeroBanner--small');
  });

  it('renders without the "small" experiment classname', () => {
    const root = render({ variant: AB_HOME_HERO_VARIANT_B });
    expect(root).not.toHaveClassName('HomeHeroBanner--small');
  });

  it('renders a carousel with random sections', () => {
    const root = render();
    const carousel = root.find(Hero);

    expect(carousel).toHaveLength(1);
    expect(carousel).toHaveProp('random', true);
  });

  it('renders a link with a src param', () => {
    const root = render();
    const hero = root.find(Hero);

    expect(hero).toHaveLength(1);
    expect(hero).toHaveProp('sections');

    const firstSection = shallow(hero.prop('sections')[0]);

    expect(firstSection.children().props().to).toEqual(
      `/addon/facebook-container/?src=${INSTALL_SOURCE_HERO_PROMO}`,
    );
  });

  it('renders the hero sections with the "random-color" class name', () => {
    const root = render();
    const hero = root.find(Hero);

    expect(hero).toHaveLength(1);
    expect(hero).toHaveProp('sections');

    const firstSection = shallow(hero.prop('sections')[0]);

    expect(firstSection).toHaveClassName('HeroSection-styleName--random-color');
  });
});
