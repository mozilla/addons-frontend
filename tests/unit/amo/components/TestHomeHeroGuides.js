import * as React from 'react';

import HomeHeroGuides, {
  HomeHeroGuidesBase,
} from 'amo/components/HomeHeroGuides';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Hero from 'ui/components/Hero';
import Icon from 'ui/components/Icon';

import Link from 'amo/components/Link';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
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
