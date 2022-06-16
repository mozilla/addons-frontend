import * as React from 'react';

import Link from 'amo/components/Link';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  dispatchClientMetadata,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const lang = 'en-US';
  let store;

  function render(props) {
    return defaultRender(<Link {...props} />, { store });
  }

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const getLink = () => screen.getByRole('link');

  it('passes `to` without leading slash without base', () => {
    expect(() => {
      render({ to: 'test' });
    }).toThrow(
      '"to" prop cannot contain a relative path; it must start with a "/".',
    );
  });

  it('passes `to.pathname` without leading slash without base', () => {
    expect(() => {
      render({ to: { pathname: 'test' } });
    }).toThrow(
      '"to" prop cannot contain a relative path; it must start with a "/".',
    );
  });

  it('prefixes the `to` prop', () => {
    const to = '/test';
    render({ to });

    expect(getLink()).toHaveAttribute('href', `/${lang}/${clientApp}${to}`);
  });

  it('does not prefix the `to` prop if it already contains the prefix', () => {
    const to = `/${lang}/${clientApp}/some/path/`;
    render({ to });

    expect(getLink()).toHaveAttribute('href', to);
  });

  it('prefixes the `to.pathname` prop', () => {
    const pathname = '/test';
    render({ to: { pathname } });

    expect(getLink()).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}${pathname}`,
    );
  });

  it('does not prefix the `to.pathname` prop if it already contains the prefix', () => {
    const pathname = `/${lang}/${clientApp}/some/path/`;
    render({ to: { pathname } });

    expect(getLink()).toHaveAttribute('href', pathname);
  });

  it('renders children when `to` is used', () => {
    const text = 'hello';
    const to = '/test';
    render({ children: text, to });

    expect(screen.getByRole('link', { name: text })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}${to}`,
    );
  });

  it('ignores `href` if not a string type', () => {
    render({ base: null, href: null, to: '/' });

    // If no href attribute is supplied the component will render a Link
    // component instead of an <a> tag.
    expect(getLink()).toHaveAttribute('href', `/${lang}/${clientApp}/`);
  });

  it('normalizes the `href` path with a string', () => {
    const href = '/test/';
    render({ href });

    expect(getLink()).toHaveAttribute('href', `/${lang}/${clientApp}${href}`);
  });

  it('does not prefix the `href` prop if it already contains the prefix', () => {
    const href = `/${lang}/${clientApp}/test/`;
    render({ href });

    expect(getLink()).toHaveAttribute('href', href);
  });

  it('does not prepend clientApp when `prependClientApp` is false', () => {
    const href = '/test';
    render({ href, prependClientApp: false });

    expect(getLink()).toHaveAttribute('href', `/${lang}${href}`);
  });

  it('does not prepend lang when `prependLang` is false', () => {
    const href = '/test';
    render({ href, prependLang: false });

    expect(getLink()).toHaveAttribute('href', `/${clientApp}${href}`);
  });

  it('does not prepend `href` when `prepend` props are false', () => {
    const href = '/test';
    render({ href, prependClientApp: false, prependLang: false });

    expect(getLink()).toHaveAttribute('href', href);
  });

  it('does not prepend `to` when `prepend` props are false', () => {
    const to = '/test';
    render({
      to,
      prependClientApp: false,
      prependLang: false,
    });

    expect(getLink()).toHaveAttribute('href', to);
  });

  it('does not prepend `to.pathname` when `prepend` props are false', () => {
    const pathname = '/test';
    render({
      to: { pathname },
      prependClientApp: false,
      prependLang: false,
    });

    expect(getLink()).toHaveAttribute('href', pathname);
  });

  it('renders children when `href` is used', () => {
    const text = 'hello';
    const href = '/test';
    render({ children: text, href });

    expect(screen.getByRole('link', { name: text })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}${href}`,
    );
  });

  it('does not add prepend props to <a> tag', () => {
    render({
      children: 'bonjour',
      href: '/test',
      prependLang: false,
    });

    const link = getLink();
    expect(link).not.toHaveAttribute('clientApp');
    expect(link).not.toHaveAttribute('lang');
    expect(link).not.toHaveAttribute('prependClientApp');
    expect(link).not.toHaveAttribute('prependLang');
  });

  it('throws an error if both `href` and `to` are supplied', () => {
    expect(() => {
      render({ href: '/test', to: '/test' });
    }).toThrowError(
      'Cannot use "href" prop and "to" prop in the same Link component',
    );
  });

  it('creates an Icon with the correct name for `external`', () => {
    render({ to: '/test', external: true });
    expect(screen.getByClassName('Icon')).toHaveClass('Icon-external');
  });

  it('creates an Icon with the correct name for `externalDark`', () => {
    render({ to: '/test', externalDark: true });
    expect(screen.getByClassName('Icon')).toHaveClass('Icon-external-dark');
  });

  it('creates an Icon with the correct name for `external` and `externalDark`', () => {
    render({
      to: '/test',
      external: true,
      externalDark: true,
    });

    expect(screen.getByClassName('Icon')).toHaveClass('Icon-external-dark');
  });

  it('adds rel="noopener noreferrer" when target is "_blank"', () => {
    render({
      href: '/test-target',
      target: '_blank',
    });

    expect(getLink()).toHaveAttribute('target', '_blank');
    expect(getLink()).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('overrides the `rel` value when target is "_blank"', () => {
    render({
      href: '/test-target',
      rel: 'some-rel',
      target: '_blank',
    });

    expect(getLink()).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('accepts a `rel` prop when target is not "_blank"', () => {
    render({
      href: '/test-target',
      rel: 'some-rel',
    });

    expect(getLink()).toHaveAttribute('rel', 'some-rel');
  });

  it('adds rel="noopener noreferrer" when target is "_blank" an `to` is used', () => {
    render({
      target: '_blank',
      to: '/test-target',
    });

    expect(getLink()).toHaveAttribute('target', '_blank');
    expect(getLink()).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not add a "rel" attribute when target is not "_blank"', () => {
    render({
      href: '/test-target',
      target: 'some-target',
    });

    expect(getLink()).toHaveAttribute('target', 'some-target');
    expect(getLink()).not.toHaveAttribute('rel');
  });
});
