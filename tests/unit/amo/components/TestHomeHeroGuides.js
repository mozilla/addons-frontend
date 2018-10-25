import * as React from 'react';

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
  });

  it('renders the hero sections', () => {
    const root = render();
    const heroSections = root.find(Hero);

    expect(heroSections).toHaveLength(1);
    expect(heroSections).toHaveProp('sections');
    expect(heroSections.props().sections).toHaveLength(3);
  });
});
