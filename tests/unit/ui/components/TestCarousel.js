import React from 'react';
import ReactSlick from 'react-slick';

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

    expect(root).toHaveClassName('Carousel');
  });

  it('throws an error if sections are not suppiled', () => {
    expect(() => {
      shallowRender();
    }).toThrow('sections are required for a Carousel component');
  });

  it('sets RTL if the language is RTL', () => {
    const root = shallowRender({
      i18n: getFakeI18nInst({ lang: 'ar' }),
      sections: [],
    });

    expect(root.find(ReactSlick)).toHaveProp('rtl', true);
  });

  it('renders sections inside divs', () => {
    const root = shallowRender({
      sections: [
        <p className="something" key="1">Howdy!</p>,
        <p className="something-else" key="2">Bonjour !</p>,
      ],
    });

    expect(root.find('div.Carousel-section-wrapper')).toHaveLength(2);
    expect(
      root.find('div.Carousel-section-wrapper > .something')
    ).toHaveLength(1);
    expect(
      root.find('div.Carousel-section-wrapper > .something-else')
    ).toHaveLength(1);
  });
});
