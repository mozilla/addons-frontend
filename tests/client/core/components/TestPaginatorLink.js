import React from 'react';
import { findDOMNode } from 'react-dom';
import { renderIntoDocument } from 'react-addons-test-utils';

import PaginatorLink from 'core/components/PaginatorLink';

describe('<PaginatorLink />', () => {
  const renderProps = Object.freeze({
    currentPage: 2,
    page: 3,
    pageCount: 4,
    pathname: '/some/link',
  });

  function renderLink(customProps = {}) {
    const props = { ...renderProps, ...customProps };
    return findDOMNode(
      renderIntoDocument(<PaginatorLink {...props} />));
  }

  it('requires currentPage', () => {
    const props = { ...renderProps };
    delete props.currentPage;
    assert.throws(
      () => renderIntoDocument(<PaginatorLink {...props} />),
      /currentPage .* cannot be undefined/);
  });

  it('requires pathname', () => {
    const props = { ...renderProps };
    delete props.pathname;
    assert.throws(
      () => renderIntoDocument(<PaginatorLink {...props} />),
      /pathname .* cannot be undefined/);
  });

  describe('when the link is to the current page', () => {
    it('does not contain a link', () => {
      const item = renderLink({ currentPage: 3, page: 3 });
      assert.strictEqual(item.querySelector('a'), null);
      assert.equal(item.textContent, '3');
    });

    it('uses the provided text', () => {
      const item = renderLink({
        currentPage: 3, page: 3, text: 'go to page',
      });
      assert.equal(item.tagName, 'SPAN');
      assert.equal(item.textContent, 'go to page');
    });
  });

  describe('when the link is to a different page', () => {
    it('has a link', () => {
      const link = renderLink({ page: 3 });
      assert.equal(link.tagName, 'A');
      assert.equal(link.textContent, '3');
    });

    it('uses the provided text', () => {
      const link = renderLink({ page: 3, text: 'go to next page' });
      assert.equal(link.tagName, 'A');
      assert.equal(link.textContent, 'go to next page');
    });

    it('renders a custom link component', () => {
      const LinkComponent = sinon.spy(() => <div />);
      renderLink({ page: 3, LinkComponent });
      assert.ok(LinkComponent.called, 'custom LinkComponent was not rendered');
    });

    it('passes query params to the link', () => {
      const page = 3;
      const queryParams = { color: 'red' };
      const LinkComponent = sinon.spy(() => <div />);
      renderLink({ queryParams, page, LinkComponent });

      assert.ok(LinkComponent.called, 'custom LinkComponent was not rendered');
      const props = LinkComponent.firstCall.args[0];
      assert.deepEqual(props.to.query, {
        ...queryParams, page,
      });
    });

    it('passes the pathname to the link', () => {
      const pathname = '/some/path';
      const LinkComponent = sinon.spy(() => <div />);
      renderLink({ page: 3, LinkComponent, pathname });

      assert.ok(LinkComponent.called, 'custom LinkComponent was not rendered');
      const props = LinkComponent.firstCall.args[0];
      assert.equal(props.to.pathname, pathname);
    });

    it('passes a className to the link', () => {
      const className = 'my-class';
      const LinkComponent = sinon.spy(() => <div />);
      renderLink({ page: 3, LinkComponent, className });

      assert.ok(LinkComponent.called, 'custom LinkComponent was not rendered');
      const props = LinkComponent.firstCall.args[0];
      assert.include(props.className, className);
    });
  });
});
