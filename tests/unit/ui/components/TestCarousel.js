import NukaCarousel from 'nuka-carousel';
import React from 'react';

import { getFakeI18nInst, shallowUntilTarget } from 'tests/unit/helpers';
import Carousel, { CarouselBase } from 'ui/components/Carousel';


describe(__filename, () => {
  function shallowRender({
    i18n = getFakeI18nInst(),
    ...props
  } = {}) {
    return shallowUntilTarget(
      <Carousel i18n={i18n} {...props} />,
      CarouselBase
    );
  }

  it('renders a Carousel', () => {
    const root = shallowRender({ sections: [] });

    expect(root.find('.Carousel')).toHaveLength(1);
    expect(root.find(NukaCarousel)).toHaveProp('cellAlign', 'left');
    expect(root.find('div.Carousel-section-wrapper')).toHaveLength(0);
  });

  it('renders a Carousel with cellAlign=right for RTL langs', () => {
    const root = shallowRender({
      i18n: getFakeI18nInst({ lang: 'ar' }),
      sections: [],
    });

    expect(root.find(NukaCarousel)).toHaveProp('cellAlign', 'right');
  });

  it('throws an error if sections are not supplied', () => {
    expect(() => {
      shallowRender();
    }).toThrow('sections are required for a Carousel component');
  });

  it('renders sections', () => {
    const root = shallowRender({
      sections: [
        <p className="something" key="1">Howdy!</p>,
        <p className="something-else" key="2">Bonjour !</p>,
      ],
    });

    expect(root.find('p')).toHaveLength(2);
    expect(root.find('.something')).toHaveLength(1);
    expect(root.find('.something-else')).toHaveLength(1);
  });
});
