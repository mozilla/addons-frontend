import { mount } from 'enzyme';
import React from 'react';
import NukaCarousel from 'nuka-carousel';

import { getFakeI18nInst, shallowUntilTarget } from 'tests/unit/helpers';
import Carousel, { CarouselBase } from 'ui/components/Carousel';


describe(__filename, () => {
  const defaultProps = {
    i18n: getFakeI18nInst(),
  };

  function shallowRender({ ...props } = {}) {
    return shallowUntilTarget(
      <Carousel {...defaultProps} {...props} />,
      CarouselBase
    );
  }

  // We mount certain tests to ensure lifecycle methods like componentDidMount
  // are called.
  // See: https://github.com/mozilla/addons-frontend/issues/3349
  function mountRender({ ...props } = {}) {
    return mount(<Carousel {...defaultProps} {...props} />);
  }

  it('throws an error if sections are not supplied', () => {
    expect(() => {
      shallowRender();
    }).toThrow('sections are required for a Carousel component');
  });

  it('renders a Carousel on the client', () => {
    const root = mountRender({ sections: [] });

    expect(root.find('.Carousel')).toHaveLength(1);
    expect(root.find(NukaCarousel)).toHaveProp('cellAlign', 'left');
    expect(root.find('.Carousel--first-render-wrapper')).toHaveLength(0);
    expect(root.find('.Carousel--first-render')).toHaveLength(0);
    expect(root.find('.Carousel-section-wrapper')).toHaveLength(0);
  });

  it('renders a Carousel with cellAlign=right for RTL langs', () => {
    const root = mountRender({
      i18n: getFakeI18nInst({ lang: 'ar' }),
      sections: [],
    });

    expect(root.find(NukaCarousel)).toHaveProp('cellAlign', 'right');
  });

  it('renders sections inside NukaCarousel on re-render', () => {
    const root = mountRender({
      sections: [
        <p className="something" key="1">Howdy!</p>,
        <p className="something-else" key="2">Bonjour !</p>,
      ],
    });

    expect(root.find(NukaCarousel).find('p')).toHaveLength(2);
    expect(root.find(NukaCarousel).find('.something')).toHaveLength(1);
    expect(root.find(NukaCarousel).find('.something-else')).toHaveLength(1);
  });

  it('does not render a NukaCarousel component on the server', () => {
    const root = shallowRender({ sections: [] });

    expect(root.find('.Carousel')).toHaveLength(1);
    expect(root.find(NukaCarousel)).toHaveLength(0);
    expect(root.find('.Carousel--first-render-wrapper')).toHaveLength(1);
    expect(root.find('.Carousel--first-render')).toHaveLength(1);
  });

  it('updates state on componentDidMount and renders a NukaCarousel', () => {
    const root = mountRender({ sections: [] });

    expect(root.find('.Carousel')).toHaveLength(1);
    expect(root.find(NukaCarousel)).toHaveLength(1);
    expect(root.find('.Carousel--first-render-wrapper')).toHaveLength(0);
    expect(root.find('.Carousel--first-render')).toHaveLength(0);
  });

  it('renders sections inside server render on the server', () => {
    const root = shallowRender({
      sections: [
        <p className="something" key="1">Howdy!</p>,
        <p className="something-else" key="2">Bonjour !</p>,
      ],
    });

    expect(root.find('.Carousel--first-render-wrapper')).toHaveLength(1);
    expect(root.find('.Carousel--first-render')).toHaveLength(1);
    expect(root.find('p')).toHaveLength(2);
    expect(root.find('.something')).toHaveLength(1);
    expect(root.find('.something-else')).toHaveLength(1);
  });
});
