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

    assert(props.base, '/fr/android');
  });

  it('accepts an empty base', () => {
    const root = render({ to: 'test' });

    assert.equal(
      findRenderedComponentWithType(root, Link).props.to, 'test');
  });

  it('allows overrides to base', () => {
    const root = render({ base: '/en-US', to: '/categories' });

    assert.equal(
      findRenderedComponentWithType(root, Link).props.to, '/en-US/categories');
  });

  it('passes an object through as a to param', () => {
    const root = render({ base: '/en-US', to: { pathname: '/categories' } });

    assert.deepEqual(
      findRenderedComponentWithType(root, Link).props.to,
      { pathname: '/en-US/categories' }
    );
  });

  it('passes other `to` types through to link', () => {
    const root = render({ base: null, to: null });

    assert.equal(findRenderedComponentWithType(root, Link).props.to, null);
  });

  it('passes `to` without leading slash without base', () => {
    const root = render({ base: '/base/', to: 'test' });

    assert.equal(findRenderedComponentWithType(root, Link).props.to, 'test');
  });

  it('passes `to.pathname` without leading slash without base', () => {
    const root = render({ base: '/base/', to: { pathname: 'test' } });

    assert.deepEqual(
      findRenderedComponentWithType(root, Link).props.to,
      { pathname: 'test' }
    );
  });

  it('normalizes the path with a string', () => {
    const root = render({ base: '/foo/', to: '/test' });

    assert.equal(
      findRenderedComponentWithType(root, Link).props.to, '/foo/test');
  });

  it('normalizes the path with an object', () => {
    const root = render({ base: '/foo', to: { pathname: 'test' } });

    assert.deepEqual(
      findRenderedComponentWithType(root, Link).props.to,
      { pathname: 'test' }
    );
  });

  it('normalizes the path with an object', () => {
    const root = render({ base: '/foo', to: { pathname: 'test' } });

    assert.deepEqual(
      findRenderedComponentWithType(root, Link).props.to,
      { pathname: 'test' }
    );
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
