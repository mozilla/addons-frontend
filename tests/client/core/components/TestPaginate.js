/* global document, Node */

import React from 'react';
import { render, findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Route, Router, createMemoryHistory } from 'react-router';

import Paginate from 'core/components/Paginate';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<Paginate />', () => {
  const getRenderProps = () => ({
    i18n: getFakeI18nInst(),
    count: 20,
    currentPage: 1,
    pathname: '/some/path',
  });

  describe('methods', () => {
    function renderPaginate(extra = {}) {
      const props = {
        ...getRenderProps(),
        ...extra,
      };
      return findRenderedComponentWithType(renderIntoDocument(
        <Paginate {...props} />
      ), Paginate).getWrappedInstance();
    }

    describe('validation', () => {
      it('does not allow an undefined count', () => {
        const props = getRenderProps();
        delete props.count;
        assert.throws(
          () => renderIntoDocument(<Paginate {...props} />),
          /count property cannot be undefined/);
      });

      it('does not allow an undefined currentPage', () => {
        const props = getRenderProps();
        delete props.currentPage;
        assert.throws(
          () => renderIntoDocument(<Paginate {...props} />),
          /currentPage property cannot be undefined/);
      });

      it('does not allow an undefined pathname', () => {
        const props = getRenderProps();
        delete props.pathname;
        assert.throws(
          () => renderIntoDocument(<Paginate {...props} />),
          /pathname property cannot be undefined/);
      });
    });

    describe('pageCount()', () => {
      it('is count / perPage', () => {
        const root = renderPaginate({ count: 100, perPage: 5 });
        assert.equal(root.pageCount(), 20);
      });

      it('uses the ceiling of the result', () => {
        const root = renderPaginate({ count: 101, perPage: 5 });
        assert.equal(root.pageCount(), 21);
      });

      it('can handle a count of zero', () => {
        const root = renderPaginate({ count: 0 });
        assert.equal(root.pageCount(), 0);
      });

      it('does not allow a per page value of zero', () => {
        assert.throws(
          () => renderPaginate({ count: 5, perPage: 0 }),
          /0 is not allowed/);
      });

      it('does not allow a negative per page value', () => {
        assert.throws(
          () => renderPaginate({ count: 5, perPage: -1 }),
          /-1 is not allowed/);
      });
    });

    describe('visiblePages()', () => {
      describe('with lots of pages', () => {
        const commonParams = { count: 30, perPage: 3, showPages: 5 };

        it('will be 0 by default', () => {
          const root = renderPaginate({
            count: 30, perPage: 3, currentPage: 1 });
          assert.deepEqual(root.visiblePages(), []);
        });

        it('will not be less than 0', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 1 });
          assert.deepEqual(root.visiblePages(), [1, 2, 3, 4, 5]);
        });

        it('will not offset near the start', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 2 });
          assert.deepEqual(root.visiblePages(), [1, 2, 3, 4, 5]);
        });

        it('will offset near the middle', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 5 });
          assert.deepEqual(root.visiblePages(), [3, 4, 5, 6, 7]);
        });

        it('will offset more near the end', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 9 });
          assert.deepEqual(root.visiblePages(), [6, 7, 8, 9, 10]);
        });

        it('will not offset more than showPages', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 10 });
          assert.deepEqual(root.visiblePages(), [6, 7, 8, 9, 10]);
        });
      });

      describe('with few pages', () => {
        const commonParams = { count: 30, perPage: 10, showPages: 5 };

        it('will not be less than 0', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 1 });
          assert.deepEqual(root.visiblePages(), [1, 2, 3]);
        });

        it('will not offset near the middle', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 2 });
          assert.deepEqual(root.visiblePages(), [1, 2, 3]);
        });

        it('will not offset near the end', () => {
          const root = renderPaginate({ count: 128, perPage: 25, showPages: 9, currentPage: 6 });
          assert.deepEqual(root.visiblePages(), [1, 2, 3, 4, 5, 6]);
        });

        it('will not offset more than showPages', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 3 });
          assert.deepEqual(root.visiblePages(), [1, 2, 3]);
        });

        it('will not render when showPages is false-y', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 3, showPages: 0 });
          assert.deepEqual(root.visiblePages(), []);
        });

        it('will not render when showPages is false', () => {
          const root = renderPaginate({ ...commonParams, currentPage: 3, showPages: false });
          assert.deepEqual(root.visiblePages(), []);
        });
      });
    });

    describe('with one page', () => {
      const commonParams = { count: 3, perPage: 10, showPages: 5 };

      it('will not render if there is only one page', () => {
        const root = findDOMNode(renderPaginate({ ...commonParams }));
        assert.equal(root, null);
      });

      it('will render with more than one page', () => {
        const root = findDOMNode(renderPaginate({ ...commonParams, count: 30 }));
        assert.ok(root.classList.contains('Paginator'));
      });
    });
  });

  describe('links', () => {
    const pathname = '/some-path/';

    class PaginateWrapper extends React.Component {
      render() {
        const props = {
          ...getRenderProps(),
          count: 50,
          currentPage: 5,
          showPages: 5,
          pathname,
        };
        return <Paginate {...props} />;
      }
    }

    function renderPaginateRoute() {
      return new Promise((resolve) => {
        const node = document.createElement('div');
        render((
          <Router history={createMemoryHistory('/')}>
            <Route path="/" component={PaginateWrapper} />
          </Router>
        ), node, () => {
          resolve(node);
        });
      });
    }

    describe('when the link is to the current page', () => {
      it('does not contain a link', () => {
        renderPaginateRoute().then((root) => {
          const link = renderIntoDocument(
            root.makeLink({ currentPage: 3, page: 3, pathname }));
          assert.equal(link.childNodes.length, 1);
          assert.equal(link.childNodes[0].nodeType, Node.TEXT_NODE);
          assert.equal(link.textContent, '3');
        });
      });

      it('uses the provided text', () => {
        renderPaginateRoute().then((root) => {
          const link = renderIntoDocument(
            root.makeLink({ currentPage: 3, page: 3, pathname, text: 'hi' }));
          assert.equal(link.childNodes.length, 1);
          assert.equal(link.childNodes[0].nodeType, Node.TEXT_NODE);
          assert.equal(link.textContent, 'hi');
        });
      });
    });

    describe('when the link is to a different page', () => {
      it('has a link', () => {
        renderPaginateRoute().then((root) => {
          const link = renderIntoDocument(
            root.makeLink({ currentPage: 2, page: 3, pathname }));
          assert.equal(link.childNodes.length, 1);
          assert.equal(link.childNodes[0].tagName, 'A');
          assert.equal(link.textContent, '3');
        });
      });

      it('uses the provided text', () => {
        renderPaginateRoute().then((root) => {
          const link = renderIntoDocument(
            root.makeLink({ currentPage: 4, page: 3, pathname, text: 'hi' }));
          assert.equal(link.childNodes.length, 1);
          assert.equal(link.childNodes[0].tagName, 'A');
          assert.equal(link.textContent, 'hi');
        });
      });
    });

    it('renders the right links', () => {
      renderPaginateRoute().then((root) => {
        const links = Array.from(root.querySelectorAll('a'));
        assert.deepEqual(
          links.map((link) => [link.textContent, link.getAttribute('href')]),
          [
            ['Prev', '/some-path/?page=4'],
            ['3', '/some-path/?page=3'],
            ['4', '/some-path/?page=4'],
            ['6', '/some-path/?page=6'],
            ['7', '/some-path/?page=7'],
            ['Next', '/some-path/?page=6'],
          ],
        );
      });
    });
  });
});
