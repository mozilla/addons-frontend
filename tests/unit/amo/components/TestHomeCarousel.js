import React from 'react';

import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import HomeCarousel, { HomeCarouselBase } from 'amo/components/HomeCarousel';
import Carousel from 'ui/components/Carousel';


describe(__filename, () => {
  function shallowRender({
    ...props
  } = {}) {
    return shallowUntilTarget(
      <HomeCarousel i18n={fakeI18n()} {...props} />,
      HomeCarouselBase
    );
  }

  it('renders a HomeCarousel', () => {
    const root = shallowRender();

    expect(root).toHaveClassName('HomeCarousel');
    expect(root.find(Carousel)).toHaveLength(1);
    expect(root.find(Carousel)).toHaveProp('random', true);
  });
});
