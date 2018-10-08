import * as React from 'react';
import { shallow } from 'enzyme';

import HomeHeroBanner, {
  HomeHeroBannerBase,
} from 'amo/components/HomeHeroBanner';
import { INSTALL_SOURCE_HERO_PROMO } from 'core/constants';
import Hero from 'ui/components/Hero';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultProps = {
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
