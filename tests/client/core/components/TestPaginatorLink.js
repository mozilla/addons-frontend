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
    expect(() => renderIntoDocument(<PaginatorLink {...props} />))
      .toThrowError(/currentPage .* cannot be undefined/);
  });

  it('requires pathname', () => {
    const props = { ...renderProps };
    delete props.pathname;
    expect(() => renderIntoDocument(<PaginatorLink {...props} />))
      .toThrowError(/pathname .* cannot be undefined/);
  });

  it('requires a page', () => {
    const props = { ...renderProps };
    delete props.page;
    expect(() => renderIntoDocument(<PaginatorLink {...props} />))
      .toThrowError(/page .* cannot be undefined/);
  });

  it('requires pageCount', () => {
    const props = { ...renderProps };
    delete props.pageCount;
    expect(() => renderIntoDocument(<PaginatorLink {...props} />))
      .toThrowError(/pageCount .* cannot be undefined/);
  });

  describe('when the link is to the current page', () => {
    it('does not contain a link', () => {
      const item = renderLink({ currentPage: 3, page: 3 });
      expect(item.querySelector('a')).toBe(null);
      expect(item.textContent).toEqual('3');
    });

    it('uses the provided text', () => {
      const item = renderLink({
        currentPage: 3, page: 3, text: 'go to page',
      });
      expect(item.tagName).toEqual('SPAN');
      expect(item.textContent).toEqual('go to page');
    });
  });

  describe('when the link is to a different page', () => {
    it('has a link', () => {
      const link = renderLink({ page: 3 });
      expect(link.tagName).toEqual('A');
      expect(link.textContent).toEqual('3');
    });

    it('uses the provided text', () => {
      const link = renderLink({ page: 3, text: 'go to next page' });
      expect(link.tagName).toEqual('A');
      expect(link.textContent).toEqual('go to next page');
    });

    it('renders a custom link component', () => {
      const LinkComponent = sinon.spy(() => <div />);
      renderLink({ page: 3, LinkComponent });
      expect(LinkComponent.called).toBeTruthy();
    });

    it('passes query params to the link', () => {
      const page = 3;
      const queryParams = { color: 'red' };
      const LinkComponent = sinon.spy(() => <div />);
      renderLink({ queryParams, page, LinkComponent });

      expect(LinkComponent.called).toBeTruthy();
      const props = LinkComponent.firstCall.args[0];
      expect(props.to.query).toEqual({
        ...queryParams, page,
      });
    });

    it('passes the pathname to the link', () => {
      const pathname = '/some/path';
      const LinkComponent = sinon.spy(() => <div />);
      renderLink({ page: 3, LinkComponent, pathname });

      expect(LinkComponent.called).toBeTruthy();
      const props = LinkComponent.firstCall.args[0];
      expect(props.to.pathname).toEqual(pathname);
    });

    it('passes a className to the link', () => {
      const className = 'my-class';
      const LinkComponent = sinon.spy(() => <div />);
      renderLink({ page: 3, LinkComponent, className });

      expect(LinkComponent.called).toBeTruthy();
      const props = LinkComponent.firstCall.args[0];
      expect(props.className).toContain(className);
    });
  });
});
