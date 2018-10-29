import { shallow } from 'enzyme';
import * as React from 'react';

import Link from 'amo/components/Link';
import HeroSection from 'ui/components/HeroSection';

describe(__filename, () => {
  function shallowRender({ ...props } = {}) {
    return shallow(<HeroSection {...props} />);
  }

  it('renders a HeroSection', () => {
    const root = shallowRender();

    expect(root).toHaveClassName('HeroSection');
  });

  it('renders a className for the styleName', () => {
    const root = shallowRender({ styleName: 'Home-privacy-matters' });

    expect(root).toHaveClassName('HeroSection-styleName--Home-privacy-matters');
  });

  it('renders default styleName className if styleName is undefined', () => {
    const root = shallowRender({ styleName: undefined });

    expect(root).toHaveClassName('HeroSection-styleName--default');
  });

  it('renders a Link if linkTo prop is supplied', () => {
    const linkTo = '/somewhere/';
    const root = shallowRender({ linkTo });
    const link = root.find(Link);

    expect(link).toHaveProp('className', 'HeroSection-link-wrapper');
    expect(link).toHaveProp('to', linkTo);
    expect(root.find('.HeroSection-wrapper')).toHaveLength(0);
  });

  it('renders children inside a Link when there is a linkTo prop', () => {
    const root = shallowRender({ children: 'hello!', linkTo: '/homepage/' });

    expect(root.find(Link)).toHaveLength(1);
    expect(root.find(Link).find('.HeroSection-content')).toHaveProp(
      'children',
      'hello!',
    );
  });

  it('renders a div if linkTo prop is not supplied', () => {
    const root = shallowRender();

    expect(root.find('.HeroSection-link-wrapper')).toHaveLength(0);
    expect(root.find('.HeroSection-wrapper')).toHaveLength(1);
  });

  it('renders a children inside div with no links', () => {
    const root = shallowRender({ children: 'hello!' });

    expect(
      root.find('.HeroSection-wrapper').find('.HeroSection-content'),
    ).toHaveText('hello!');
  });
});
