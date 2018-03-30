import * as React from 'react';
import { renderIntoDocument } from 'react-dom/test-utils';

import Card from 'ui/components/Card';


describe('<Card />', () => {
  function render(props = {}) {
    return renderIntoDocument(<Card {...props} />);
  }

  it('renders a Card', () => {
    const root = render({ className: 'TofuSection' });
    expect(root.cardContainer).toBeTruthy();
    expect(root.cardContainer.tagName).toEqual('SECTION');
    expect(root.cardContainer.className).toContain('Card');
    expect(root.cardContainer.className).toContain('TofuSection');
  });

  it('does not use photon class by default', () => {
    const root = render({ children: 'hello' });
    expect(root.cardContainer.className).not.toContain('Card--photon');
  });

  it('uses photon class if marked', () => {
    const root = render({ children: 'hello', photonStyle: true });
    expect(root.cardContainer.className).toContain('Card--photon');
  });

  it('shows header if supplied', () => {
    const root = render({ header: 'foo' });
    expect(root.header).toBeTruthy();
  });

  it('hides header if none supplied', () => {
    const root = render({ children: 'hello' });
    expect(root.header).toBeFalsy();
    expect(root.cardContainer.className).toContain('Card--no-header');
  });

  it('shows footer text if supplied', () => {
    const root = render({ footerText: 'foo' });
    expect(root.footer).toBeTruthy();
    expect(root.footer.textContent).toEqual('foo');
    expect(root.footer.className).toEqual('Card-footer-text');
  });

  it('shows a footer link if supplied', () => {
    const root = render({ footerLink: <a href="/some-link">Some link</a> });
    expect(root.footer).toBeTruthy();
    expect(root.footer.textContent).toEqual('Some link');
    expect(root.footer.className).toEqual('Card-footer-link');
  });

  it('throws an error if you mix footer content', () => {
    expect(() => render({
      footerLink: <a href="/some-link">Some link</a>,
      footerText: 'something else',
    })).toThrowError(/cannot specify footerLink and footerText/);
  });

  it('hides footer if none supplied', () => {
    const root = render({ children: 'hello' });
    expect(root.footer).toBeFalsy();
    expect(root.cardContainer.className).toContain('Card--no-footer');
  });

  it('renders children', () => {
    const root = render({ children: 'hello' });
    expect(root.contents).toBeTruthy();
    expect(root.contents.textContent).toContain('hello');
  });

  it('omits the content div with no children', () => {
    const root = render();
    expect(root.contents).toBeFalsy();
  });
});
