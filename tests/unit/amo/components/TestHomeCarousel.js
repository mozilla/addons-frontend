import React from 'react';

import { getFakeI18nInst, shallowUntilTarget } from 'tests/unit/helpers';
import HomeCarousel, { HomeCarouselBase } from 'amo/components/HomeCarousel';
import Carousel from 'ui/components/Carousel';


describe(__filename, () => {
  function shallowRender({
    ...props
  } = {}) {
    return shallowUntilTarget(
      <HomeCarousel i18n={getFakeI18nInst()} {...props} />,
      HomeCarouselBase
    );
  }

  it('renders a HomeCarousel', () => {
    const root = shallowRender();

    expect(root).toHaveClassName('HomeCarousel');
    expect(root.find(Carousel)).toHaveLength(1);
  });
});
