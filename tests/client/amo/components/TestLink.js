import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Link } from 'react-router';

import { LinkBase, mapStateToProps } from 'amo/components/Link';


describe('<Link />', () => {
  const defaultState = { api: { clientApp: 'android', lang: 'fr' } };

  function render(props) {
    return renderIntoDocument(<LinkBase {...props} />);
  }

  it('uses clientApp and lang from API state', () => {
    const props = mapStateToProps(defaultState);

    expect(props.base).toBeTruthy();
  });

  it('accepts an empty base', () => {
    const root = render({ to: 'test' });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual('test');
  });

  it('allows overrides to base', () => {
    const root = render({ base: '/en-US', to: '/categories' });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual('/en-US/categories');
  });

  it('passes an object through as a to param', () => {
    const root = render({ base: '/en-US', to: { pathname: '/categories' } });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual({ pathname: '/en-US/categories' });
  });

  it('passes other `to` types through to link', () => {
    const root = render({ base: null, to: null });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual(null);
  });

  it('passes `to` without leading slash without base', () => {
    const root = render({ base: '/base/', to: 'test' });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual('test');
  });

  it('passes `to.pathname` without leading slash without base', () => {
    const root = render({ base: '/base/', to: { pathname: 'test' } });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual({ pathname: 'test' });
  });

  it('normalizes the path with a string', () => {
    const root = render({ base: '/foo/', to: '/test' });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual('/foo/test');
  });

  it('normalizes the path with an object', () => {
    const root = render({ base: '/foo', to: { pathname: 'test' } });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual({ pathname: 'test' });
  });

  it('normalizes the path with an object', () => {
    const root = render({ base: '/foo', to: { pathname: 'test' } });

    expect(findRenderedComponentWithType(root, Link).props.to).toEqual({ pathname: 'test' });
  });

  it('renders children when `to` is used', () => {
    const root = render({ base: '/foo/', children: 'hello', to: '/test' });

    assert.equal(findDOMNode(root).textContent, 'hello');
  });

  it('does add base prop to Link component', () => {
    const root = render({ base: '/foo/', children: 'bonjour', to: '/test' });

    assert.equal(findRenderedComponentWithType(root, Link).props.base, null);
  });

  it('ignores `href` if not a string type', () => {
    const root = render({ base: null, href: null });

    // If no href attribute is supplied the component will render a Link
    // component instead of an <a> tag.
    assert.ok(findRenderedComponentWithType(root, Link));
  });

  it('does not prepend base to `href` with no leading slash', () => {
    const root = render({ base: '/base/', href: 'test' });

    assert.notInclude(findDOMNode(root, 'a').href, '/base/');
    assert.include(findDOMNode(root, 'a').href, 'test');
  });

  it('normalizes the `href` path with a string', () => {
    const root = render({ base: '/foo/', href: '/test' });

    assert.include(findDOMNode(root, 'a').href, '/foo/test');
  });

  it('renders children when `href` is used', () => {
    const root = render({ base: '/foo/', children: 'bonjour', href: '/test' });

    assert.equal(findDOMNode(root).textContent, 'bonjour');
  });

  it('does not add base prop to <a> tag', () => {
    const root = render({ base: '/foo/', children: 'bonjour', href: '/test' });

    assert.equal(findDOMNode(root).attributes.getNamedItem('base'), null);
  });

  it('throws an error if both `href` and `to` are supplied', () => {
    assert.throws(() => {
      render({ href: '/test', to: '/test' });
    }, 'Cannot use "href" prop and "to" prop in the same Link component');
  });
});
