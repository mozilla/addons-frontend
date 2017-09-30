import { shallow } from 'enzyme';
import React from 'react';

import Carousel from 'ui/components/Carousel';


describe(__filename, () => {
  function shallowRender({
    ...props
  } = {}) {
    return shallow(<Carousel {...props} />);
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
