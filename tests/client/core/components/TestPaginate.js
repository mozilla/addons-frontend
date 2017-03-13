/* global document, Node */

import React from 'react';
import { render, findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
  scryRenderedComponentsWithType,
} from 'react-addons-test-utils';
import { Route, Router, createMemoryHistory } from 'react-router';

import Paginate from 'core/components/Paginate';
import PaginatorLink from 'core/components/PaginatorLink';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<Paginate />', () => {
  const getRenderProps = () => ({
    i18n: getFakeI18nInst(),
    count: 20,
    currentPage: 1,
    pathname: '/some/path',
  });

  function renderPaginate(extra = {}) {
    const props = {
      ...getRenderProps(),
      ...extra,
    };
    return findRenderedComponentWithType(renderIntoDocument(
      <Paginate {...props} />
    ), Paginate).getWrappedInstance();
  }

  describe('methods', () => {
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
      function getVisiblePages(customProps = {}) {
        const root = renderPaginate(customProps);
        return root.visiblePages({ pageCount: root.pageCount() });
      }

      describe('with lots of pages', () => {
        const commonParams = { count: 30, perPage: 3, showPages: 5 };

        it('will be 0 by default', () => {
          assert.deepEqual(
            getVisiblePages({ count: 30, perPage: 3, currentPage: 1 }),
            []);
        });

        it('will not be less than 0', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 1 });
          assert.deepEqual(pages, [1, 2, 3, 4, 5]);
        });

        it('will not offset near the start', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 2 });
          assert.deepEqual(pages, [1, 2, 3, 4, 5]);
        });

        it('will offset near the middle', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 5 });
          assert.deepEqual(pages, [3, 4, 5, 6, 7]);
        });

        it('will offset more near the end', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 9 });
          assert.deepEqual(pages, [6, 7, 8, 9, 10]);
        });

        it('will not offset more than showPages', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 10 });
          assert.deepEqual(pages, [6, 7, 8, 9, 10]);
        });
      });

      describe('with few pages', () => {
        const commonParams = { count: 30, perPage: 10, showPages: 5 };

        it('will not be less than 0', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 1 });
          assert.deepEqual(pages, [1, 2, 3]);
        });

        it('will not offset near the middle', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 2 });
          assert.deepEqual(pages, [1, 2, 3]);
        });

        it('will not offset near the end', () => {
          const pages = getVisiblePages({
            count: 128, perPage: 25, showPages: 9, currentPage: 6,
          });
          assert.deepEqual(pages, [1, 2, 3, 4, 5, 6]);
        });

        it('will not offset more than showPages', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 3 });
          assert.deepEqual(pages, [1, 2, 3]);
        });

        it('will not render when showPages is false-y', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 3, showPages: 0 });
          assert.deepEqual(pages, []);
        });

        it('will not render when showPages is false', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 3, showPages: false });
          assert.deepEqual(pages, []);
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
        assert.ok(root.classList.contains('Paginate'));
      });
    });
  });

  it('passes props to paginator links', () => {
    const currentPage = 1;
    const pageCount = 3;
    const queryParams = { color: 'red' };
    const LinkComponent = () => <div />;
    const pathname = '/some/path';

    const root = renderPaginate({
      LinkComponent,
      count: 3,
      currentPage,
      pathname,
      pageCount,
      perPage: 1,
      queryParams,
    });

    const links = scryRenderedComponentsWithType(root, PaginatorLink);
    // Just do a quick sanity check on the first link.
    assert.equal(links[0].props.LinkComponent, LinkComponent);
    assert.deepEqual(links[0].props.queryParams, queryParams);
    assert.equal(links[0].props.currentPage, currentPage);
    assert.equal(links[0].props.pathname, pathname);
    assert.equal(links[0].props.pageCount, pageCount);
  });

  it('renders the right links', () => {
    const pathname = '/some-path/';

    class PaginateWrapper extends React.Component {
      render() {
        const props = {
          ...getRenderProps(),
          count: 250,
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

    return renderPaginateRoute().then((root) => {
      const links = Array.from(root.querySelectorAll('a'));
      assert.deepEqual(
        links.map((link) => [link.textContent, link.getAttribute('href')]),
        [
          ['Previous', '/some-path/?page=4'],
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
