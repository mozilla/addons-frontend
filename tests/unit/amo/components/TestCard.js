import { shallow } from 'enzyme';
import * as React from 'react';

import Card from 'amo/components/Card';

describe(__filename, () => {
  function render(props = {}) {
    return shallow(<Card {...props} />);
  }

  it('renders a Card', () => {
    const root = render({ className: 'TofuSection' });

    expect(root.find('section')).toHaveLength(1);

    expect(root).toHaveClassName('Card');
    expect(root).toHaveClassName('TofuSection');

    expect(root.find('.Card-header')).toHaveLength(0);
    expect(root.find('.Card-contents')).toHaveLength(0);
    expect(root.find('.Card-footer')).toHaveLength(0);
  });

  it('does not use photon class by default', () => {
    const root = render({ children: 'hello' });
    expect(root).not.toHaveClassName('Card--photon');
  });

  it('uses photon class if marked', () => {
    const root = render({ children: 'hello', photonStyle: true });
    expect(root).toHaveClassName('Card--photon');
  });

  it('shows header if supplied', () => {
    const root = render({ header: 'foo' });
    expect(root.find('.Card-header')).toHaveLength(1);
    expect(root.find('.Card-header')).toHaveText('foo');
  });

  it('hides header if none supplied', () => {
    const root = render({ children: 'hello' });
    expect(root.find('.Card-header')).toHaveLength(0);
    expect(root).toHaveClassName('Card--no-header');
  });

  it('shows footer text if supplied', () => {
    const root = render({ footerText: 'foo' });
    expect(root.find('.Card-footer')).toHaveLength(1);
    expect(root.find('.Card-footer')).toHaveText('foo');
    expect(root.find('.Card-footer')).toHaveClassName('Card-footer-text');
  });

  it('shows a footer link if supplied', () => {
    const root = render({ footerLink: <a href="/some-link">Some link</a> });
    expect(root.find('.Card-footer')).toHaveLength(1);
    expect(root.find('.Card-footer')).toHaveText('Some link');
    expect(root.find('.Card-footer')).toHaveClassName('Card-footer-link');
  });

  it('throws an error if both footerLink and footerText props are passed', () => {
    expect(() => {
      render({
        footerLink: <a href="/some-link">Some link</a>,
        footerText: 'something else',
      });
    }).toThrowError(/can only specify exactly one of these props/);
  });

  it('throws an error if both footerLink and footer props are passed', () => {
    expect(() => {
      render({
        footerLink: <a href="/some-link">Some link</a>,
        footer: 'something else',
      });
    }).toThrowError(/can only specify exactly one of these props/);
  });

  it('throws an error if both footer and footerText props are passed', () => {
    expect(() => {
      render({
        footer: <a href="/some-link">Some link</a>,
        footerText: 'something else',
      });
    }).toThrowError(/can only specify exactly one of these props/);
  });

  it('hides footer if none supplied', () => {
    const root = render({ children: 'hello' });
    expect(root.find('.Card-footer')).toHaveLength(0);
    expect(root).toHaveClassName('Card--no-footer');
  });

  it('renders children', () => {
    const root = render({ children: 'hello' });
    expect(root.find('.Card-contents')).toHaveLength(1);
    expect(root.find('.Card-contents')).toHaveText('hello');
  });

  it('omits the content div with no children', () => {
    const root = render();
    expect(root.find('.Card-contents')).toHaveLength(0);
  });
});
