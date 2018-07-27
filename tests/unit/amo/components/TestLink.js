import { createMemoryHistory } from 'history';
import * as React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';
import { Router, Link as ReactRouterLink } from 'react-router-dom';

import Link, { LinkBase, mapStateToProps } from 'amo/components/Link';
import createStore from 'amo/store';
import { setClientApp, setLang } from 'core/actions';
import Icon from 'ui/components/Icon';
import { shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  function render(props) {
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return renderIntoDocument(
      <Router history={createMemoryHistory()}>
        <Link store={store} {...props} />
      </Router>,
    );
  }

  function shallowRender(props) {
    return shallowUntilTarget(<Link store={store} {...props} />, LinkBase);
  }

  beforeEach(() => {
    store = createStore().store;
    store.dispatch(setClientApp('android'));
    store.dispatch(setLang('fr'));
  });

  it('uses clientApp and lang from API state', () => {
    const props = mapStateToProps(store.getState());

    expect(props.clientApp).toBeTruthy();
    expect(props.lang).toBeTruthy();
  });

  it('passes an object through as a to param', () => {
    const root = render({ to: { pathname: '/categories' } });

    expect(
      findRenderedComponentWithType(root, ReactRouterLink).props.to,
    ).toEqual({ pathname: '/fr/android/categories' });
  });

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
    const root = render({ to: '/test' });

    expect(
      findRenderedComponentWithType(root, ReactRouterLink).props.to,
    ).toEqual('/fr/android/test');
  });

  it('prefixes the `to.pathname` prop', () => {
    const root = render({ to: { pathname: '/test' } });

    expect(
      findRenderedComponentWithType(root, ReactRouterLink).props.to,
    ).toEqual({ pathname: '/fr/android/test' });
  });

  it('renders children when `to` is used', () => {
    const root = render({ children: 'hello', to: '/test' });

    expect(findDOMNode(root).textContent).toEqual('hello');
  });

  it('does not pass prepend props through to Link component', () => {
    const root = render({
      children: 'bonjour',
      prependLang: false,
      to: '/test',
    });
    const { props } = findRenderedComponentWithType(root, ReactRouterLink);

    expect(props.clientApp).toEqual(undefined);
    expect(props.lang).toEqual(undefined);
    expect(props.prependClientApp).toEqual(undefined);
    expect(props.prependLang).toEqual(undefined);
  });

  it('ignores `href` if not a string type', () => {
    const root = render({ base: null, href: null, to: '/' });

    // If no href attribute is supplied the component will render a Link
    // component instead of an <a> tag.
    expect(findRenderedComponentWithType(root, ReactRouterLink)).toBeTruthy();
  });

  it('normalizes the `href` path with a string', () => {
    const root = render({ href: '/test' });

    expect(findDOMNode(root, 'a').href).toContain('/fr/android/test');
  });

  it('does not prepend clientApp when `prependClientApp` is false', () => {
    const root = render({ href: '/test', prependClientApp: false });

    expect(findDOMNode(root, 'a').href).toContain('/fr/test');
    expect(findDOMNode(root, 'a').href).not.toContain('/fr/android/test');
  });

  it('does not prepend lang when `prependLang` is false', () => {
    const root = render({ href: '/test', prependLang: false });

    expect(findDOMNode(root, 'a').href).toContain('/android/test');
    expect(findDOMNode(root, 'a').href).not.toContain('/fr/android/test');
  });

  it('does not prepend `href` when `prepend` props are false', () => {
    const root = render({
      href: '/test',
      prependClientApp: false,
      prependLang: false,
    });

    const hrefProp = findDOMNode(root, 'a').href;

    expect(hrefProp).toContain('/test');
    expect(hrefProp).not.toContain('/fr/test');
    expect(hrefProp).not.toContain('/android/test');
    expect(hrefProp).not.toContain('/fr/android/test');
  });

  it('does not prepend `to` when `prepend` props are false', () => {
    const root = render({
      to: '/test',
      prependClientApp: false,
      prependLang: false,
    });

    const toProp = findRenderedComponentWithType(root, ReactRouterLink).props
      .to;

    expect(toProp).toContain('/test');
    expect(toProp).not.toContain('/fr/test');
    expect(toProp).not.toContain('/android/test');
    expect(toProp).not.toContain('/fr/android/test');
  });

  it('does not prepend `to.pathname` when `prepend` props are false', () => {
    const root = render({
      to: { pathname: '/test' },
      prependClientApp: false,
      prependLang: false,
    });

    const toProp = findRenderedComponentWithType(root, ReactRouterLink).props
      .to;

    expect(toProp.pathname).toContain('/test');
    expect(toProp.pathname).not.toContain('/fr/test');
    expect(toProp.pathname).not.toContain('/android/test');
    expect(toProp.pathname).not.toContain('/fr/android/test');
  });

  it('renders children when `href` is used', () => {
    const root = render({ children: 'bonjour', href: '/test' });

    expect(findDOMNode(root).textContent).toEqual('bonjour');
  });

  it('does not add prepend props to <a> tag', () => {
    const root = render({
      children: 'bonjour',
      href: '/test',
      prependLang: false,
    });
    const { attributes } = findDOMNode(root);

    expect(attributes.getNamedItem('clientApp')).toEqual(null);
    expect(attributes.getNamedItem('lang')).toEqual(null);
    expect(attributes.getNamedItem('prependClientApp')).toEqual(null);
    expect(attributes.getNamedItem('prependLang')).toEqual(null);
  });

  it('throws an error if both `href` and `to` are supplied', () => {
    expect(() => {
      render({ href: '/test', to: '/test' });
    }).toThrowError(
      'Cannot use "href" prop and "to" prop in the same Link component',
    );
  });

  it('creates an Icon with the correct name for `external`', () => {
    const root = shallowRender({ to: '/test', external: true });

    expect(root.find(Icon)).toHaveProp('name', `external`);
  });

  it('creates an Icon with the correct name for `externalDark`', () => {
    const root = shallowRender({ to: '/test', externalDark: true });

    expect(root.find(Icon)).toHaveProp('name', `external-dark`);
  });

  it('creates an Icon with the correct name for `external` and `externalDark`', () => {
    const root = shallowRender({
      to: '/test',
      external: true,
      externalDark: true,
    });

    expect(root.find(Icon)).toHaveProp('name', `external-dark`);
  });
});
