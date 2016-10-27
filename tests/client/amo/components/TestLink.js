import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Link } from 'react-router';

import { LinkBase, mapStateToProps } from 'amo/components/Link';


describe('<Link />', () => {
  const defaultState = { api: { clientApp: 'android', lang: 'fr' } };

  function render(props) {
    return renderIntoDocument(
      <LinkBase {...props}>Hi</LinkBase>);
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
});
