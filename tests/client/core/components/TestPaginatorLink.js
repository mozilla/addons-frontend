import React from 'react';
import { findDOMNode } from 'react-dom';
import { renderIntoDocument } from 'react-addons-test-utils';

import PaginatorLink from 'core/components/PaginatorLink';

describe('<PaginatorLink />', () => {
  function renderLink(customProps = {}) {
    const props = {
      currentPage: 2,
      page: 3,
      pageCount: 4,
      pathname: '/some/link',
      ...customProps,
    };
    return findDOMNode(
      renderIntoDocument(<PaginatorLink {...props} />));
  }

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
  });
});
