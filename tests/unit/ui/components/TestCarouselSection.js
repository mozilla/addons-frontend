import { shallow } from 'enzyme';
import React from 'react';

import Link from 'amo/components/Link';
import CarouselSection from 'ui/components/CarouselSection';


describe(__filename, () => {
  function shallowRender({
    ...props
  } = {}) {
    return shallow(<CarouselSection {...props} />);
  }

  it('renders a CarouselSection', () => {
    const root = shallowRender();

    expect(root).toHaveClassName('CarouselSection');
  });

  it('renders a className for the styleName', () => {
    const root = shallowRender({ styleName: 'Home-privacy-matters' });

    expect(root)
      .toHaveClassName('CarouselSection-styleName--Home-privacy-matters');
  });

  it('renders default styleName className if styleName is undefined', () => {
    const root = shallowRender({ styleName: undefined });

    expect(root).toHaveClassName('CarouselSection-styleName--default');
  });

  it('renders a Link if linkTo prop is supplied', () => {
    const root = shallowRender({ linkTo: '/whatever/' });
    const link = root.find(Link);

    expect(link).toHaveProp('className', 'CarouselSection-link-wrapper');
    expect(link).toHaveProp('to', '/whatever/');
    expect(root.find('.CarouselSection-wrapper')).toHaveLength(0);
  });

  it('renders a children inside Link with a linkTo prop', () => {
    const root = shallowRender({ children: 'hello!', linkTo: '/homepage/' });

    expect(root.find(Link)).toHaveProp('children', 'hello!');
  });

  it('renders a div if linkTo prop is not supplied', () => {
    const root = shallowRender();

    expect(root.find('.CarouselSection-link-wrapper')).toHaveLength(0);
    expect(root.find('.CarouselSection-wrapper')).toHaveLength(1);
  });

  it('renders a children inside div with no links', () => {
    const root = shallowRender({ children: 'hello!' });

    expect(root.find('.CarouselSection-wrapper')).toHaveText('hello!');
  });
});
