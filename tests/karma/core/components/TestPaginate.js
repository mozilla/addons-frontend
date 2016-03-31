import React from 'react';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';
import Paginate from 'core/components/Paginate';

describe('<Paginate />', () => {
  function render({count = 20, currentPage = 1, pager = sinon.spy(), ...extra}) {
    return renderIntoDocument(
      <Paginate count={count} currentPage={currentPage} pager={pager} {...extra} />);
  }

  describe('pageCount()', () => {
    it('is count / perPage', () => {
      const root = render({count: 100, perPage: 5});
      assert.equal(root.pageCount(), 20);
    });

    it('uses the ceiling of the result', () => {
      const root = render({count: 101, perPage: 5});
      assert.equal(root.pageCount(), 21);
    });
  });

  describe('visiblePages()', () => {
    describe('with lots of pages', () => {
      const commonParams = {count: 30, perPage: 3, showPages: 5};

      it('will not be less than 0', () => {
        const root = render({ ...commonParams, currentPage: 1});
        assert.deepEqual(root.visiblePages(), [1, 2, 3, 4, 5]);
      });

      it('will not offset near the start', () => {
        const root = render({ ...commonParams, currentPage: 2});
        assert.deepEqual(root.visiblePages(), [1, 2, 3, 4, 5]);
      });

      it('will offset near the middle', () => {
        const root = render({ ...commonParams, currentPage: 5});
        assert.deepEqual(root.visiblePages(), [3, 4, 5, 6, 7]);
      });

      it('will offset more near the end', () => {
        const root = render({ ...commonParams, currentPage: 9});
        assert.deepEqual(root.visiblePages(), [6, 7, 8, 9, 10]);
      });

      it('will not offset more than showPages', () => {
        const root = render({ ...commonParams, currentPage: 10});
        assert.deepEqual(root.visiblePages(), [6, 7, 8, 9, 10]);
      });
    });

    describe('with few pages', () => {
      const commonParams = {count: 30, perPage: 10, showPages: 5};

      it('will not be less than 0', () => {
        const root = render({ ...commonParams, currentPage: 1});
        assert.deepEqual(root.visiblePages(), [1, 2, 3]);
      });

      it('will not offset near the middle', () => {
        const root = render({ ...commonParams, currentPage: 2});
        assert.deepEqual(root.visiblePages(), [1, 2, 3]);
      });

      it('will not offset more than showPages', () => {
        const root = render({ ...commonParams, currentPage: 3});
        assert.deepEqual(root.visiblePages(), [1, 2, 3]);
      });
    });
  });

  describe('makeLink()', () => {
    let pager;
    let root;

    beforeEach(() => {
      pager = sinon.spy();
      root = new Paginate({count: 50, currentPage: 5, pager});
    });

    describe('when the link is to the current page', () => {
      it('does not contain a link', () => {
        const link = renderIntoDocument(root.makeLink({currentPage: 3, page: 3, pager}));
        assert.equal(link.childNodes.length, 1);
        assert.equal(link.childNodes[0].nodeType, Node.TEXT_NODE);
        assert.equal(link.textContent, '3');
      });

      it('uses the provided text', () => {
        const link = renderIntoDocument(
          root.makeLink({currentPage: 3, page: 3, pager, text: 'hi'}));
        assert.equal(link.childNodes.length, 1);
        assert.equal(link.childNodes[0].nodeType, Node.TEXT_NODE);
        assert.equal(link.textContent, 'hi');
      });
    });

    describe('when the link is to a different page', () => {
      it('has a link', () => {
        const link = renderIntoDocument(root.makeLink({currentPage: 2, page: 3, pager}));
        assert.equal(link.childNodes.length, 1);
        assert.equal(link.childNodes[0].tagName, 'A');
        assert.equal(link.textContent, '3');
      });

      it('uses the provided text', () => {
        const link = renderIntoDocument(
          root.makeLink({currentPage: 4, page: 3, pager, text: 'hi'}));
        assert.equal(link.childNodes.length, 1);
        assert.equal(link.childNodes[0].tagName, 'A');
        assert.equal(link.textContent, 'hi');
      });

      it('calls the pager when clicked', () => {
        assert(!pager.called, 'pager was called early');
        const link = renderIntoDocument(
          root.makeLink({currentPage: 4, page: 3, pager, text: 'hi'}));
        Simulate.click(link.querySelector('a'));
        assert(pager.calledWith(3));
      });
    });
  });
});
