import * as React from 'react';

import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import HomeHeroBanner, { HomeHeroBannerBase } from 'amo/components/HomeHeroBanner';
import Hero from 'ui/components/Hero';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  const defaultProps = {
    i18n: fakeI18n(),
    store: dispatchClientMetadata().store,
  };

  function shallowRender(props) {
    return shallowUntilTarget(
      <HomeHeroBanner {...defaultProps} {...props} />,
      HomeHeroBannerBase
    );
  }

  it('renders a HomeHeroBanner', () => {
    const root = shallowRender();

    expect(root).toHaveClassName('HomeHeroBanner');
  });

  it('renders a carousel with random sections', () => {
    const root = shallowRender();
    const carousel = root.find(Hero);

    expect(carousel).toHaveLength(1);
    expect(carousel).toHaveProp('random', true);
  });
});
