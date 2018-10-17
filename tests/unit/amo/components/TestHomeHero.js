import * as React from 'react';

import HomeHero, { HomeHeroBase } from 'amo/components/HomeHero';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Hero from 'ui/components/Hero';

describe(__filename, () => {
  const defaultProps = {
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
  };

  function render(props) {
    return shallowUntilTarget(
      <HomeHero {...defaultProps} {...props} />,
      HomeHeroBase,
    );
  }

  it('renders a HomeHero', () => {
    const root = render();
    expect(root).toHaveClassName('HomeHero');
  });

  it('renders the hero sections', () => {
    const root = render();
    const heroSections = root.find(Hero);

    expect(heroSections).toHaveLength(1);

    expect(heroSections).toHaveProp('sections');
    expect(heroSections.props().sections).toHaveLength(3);
  });
});
