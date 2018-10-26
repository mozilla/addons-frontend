import * as React from 'react';
import { shallow } from 'enzyme';

import HomeHeroGuides, {
  HomeHeroGuidesBase,
} from 'amo/components/HomeHeroGuides';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Hero from 'ui/components/Hero';

describe(__filename, () => {
  const render = (props) => {
    return shallowUntilTarget(
      <HomeHeroGuides i18n={fakeI18n()} {...props} />,
      HomeHeroGuidesBase,
    );
  };

  it('renders a HomeHeroGuides', () => {
    const root = render();

    expect(root).toHaveClassName('HomeHeroGuides');
    expect(root.find('.HomeHeroGuides-header-title')).toHaveLength(1);
    expect(root.find('.HomeHeroGuides-header-subtitle')).toHaveLength(1);
    expect(root.find('.HomeHeroGuides-header-title').text()).toMatch(
      /Extensions are/,
    );
    expect(root.find('.HomeHeroGuides-header-subtitle').text()).toMatch(
      /They add features/,
    );
  });

  it('renders the hero sections', () => {
    const root = render();
    const hero = root.find(Hero);

    expect(hero).toHaveLength(1);
    expect(hero).toHaveProp('sections');
    expect(hero.prop('sections')).toHaveLength(3);

    const firstSection = shallow(hero.prop('sections')[0]);

    expect(firstSection.find('.HeroSection-link-wrapper')).toHaveLength(1);
  });
});
