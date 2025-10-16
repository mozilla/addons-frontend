import * as React from 'react';

import Card from 'amo/components/Card';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    return defaultRender(<Card {...props} />);
  }

  const getCard = () => screen.getByTagName('section');

  it('renders a Card', () => {
    render({ className: 'TofuSection' });

    expect(screen.getByTagName('section')).toBeInTheDocument();

    const card = getCard();
    expect(card).toHaveClass('TofuSection');

    expect(screen.queryByTagName('header')).not.toBeInTheDocument();
    expect(card).toHaveClass('Card--no-header');
    expect(screen.queryByTagName('footer')).not.toBeInTheDocument();
    expect(card).toHaveClass('Card--no-footer');
    expect(screen.queryByClassName('Card-contents')).not.toBeInTheDocument();
    expect(card).toHaveTextContent('');

    expect(
      screen.queryByClassName('Card-shelf-footer-in-header'),
    ).not.toBeInTheDocument();

    expect(card).not.toHaveClass('Card--photon');
  });

  it('uses the noStyle class if marked', () => {
    render({ noStyle: true });
    expect(getCard()).toHaveClass('Card--no-style');
  });

  it('shows header if supplied', () => {
    const header = 'foo';
    render({ header });

    expect(screen.getByTagName('header')).toHaveTextContent(header);
  });

  it('does not use HomepageShelf classes by default', () => {
    render({
      children: 'hello',
      footer: 'bar',
      header: 'foo',
    });

    expect(screen.getByTagName('header')).not.toHaveClass('Card-shelf-header');
    expect(screen.getByTagName('footer')).not.toHaveClass('Card-shelf-footer');
    expect(
      screen.queryByClassName('Card-shelf-footer-in-header'),
    ).not.toBeInTheDocument();
  });

  it('uses HomepageShelf classes if isHomepageShelf is true', () => {
    render({
      children: 'hello',
      footer: 'bar',
      header: 'foo',
      isHomepageShelf: true,
    });

    const footers = screen.getAllByTagName('footer');
    expect(screen.getByTagName('header')).toHaveClass('Card-shelf-header');
    expect(footers[0]).toHaveClass('Card-shelf-footer-in-header');
    expect(footers[1]).toHaveClass('Card-shelf-footer');
    for (const footer of footers) {
      expect(footer).toHaveTextContent('bar');
    }
  });

  it('shows footer text if supplied', () => {
    const footerText = 'foo';
    render({ footerText });

    const footer = screen.getByTagName('footer');
    expect(footer).toHaveTextContent(footerText);
    expect(footer).toHaveClass('Card-footer-text');
  });

  it('shows a footer link if supplied', () => {
    const linkText = 'Some link';
    const linkUrl = '/some/link';
    render({ footerLink: <a href={linkUrl}>{linkText}</a> });

    expect(screen.getByRole('link', { name: linkText })).toHaveAttribute(
      'href',
      linkUrl,
    );
    expect(screen.getByTagName('footer')).toHaveClass('Card-footer-link');
  });

  it('throws an error if both footerLink and footerText props are passed', () => {
    expect(() => {
      render({
        footerLink: <a href="/some-link">Some link</a>,
        footerText: 'something else',
      });
    }).toThrow(/can only specify exactly one of these props/);
  });

  it('throws an error if both footerLink and footer props are passed', () => {
    expect(() => {
      render({
        footerLink: <a href="/some-link">Some link</a>,
        footer: 'something else',
      });
    }).toThrow(/can only specify exactly one of these props/);
  });

  it('throws an error if both footer and footerText props are passed', () => {
    expect(() => {
      render({
        footer: <a href="/some-link">Some link</a>,
        footerText: 'something else',
      });
    }).toThrow(/can only specify exactly one of these props/);
  });

  it('renders children', () => {
    const text = 'hello';
    render({ children: text });

    expect(screen.getByText(text)).toHaveClass('Card-contents');
  });
});
