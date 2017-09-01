/* global document */

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
import { getFakeI18nInst } from 'tests/unit/helpers';

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
    return findRenderedComponentWithType(
      renderIntoDocument(<Paginate {...props} />),
      Paginate
    ).getWrappedInstance();
  }

  describe('methods', () => {
    describe('validation', () => {
      it('does not allow an undefined count', () => {
        const props = getRenderProps();
        delete props.count;
        expect(() => renderIntoDocument(<Paginate {...props} />)).toThrowError(
          /count property cannot be undefined/
        );
      });

      it('does not allow an undefined currentPage', () => {
        const props = getRenderProps();
        delete props.currentPage;
        expect(() => renderIntoDocument(<Paginate {...props} />)).toThrowError(
          /currentPage property cannot be undefined/
        );
      });

      it('does not allow an undefined pathname', () => {
        const props = getRenderProps();
        delete props.pathname;
        expect(() => renderIntoDocument(<Paginate {...props} />)).toThrowError(
          /pathname property cannot be undefined/
        );
      });
    });

    describe('pageCount()', () => {
      it('is count / perPage', () => {
        const root = renderPaginate({ count: 100, perPage: 5 });
        expect(root.pageCount()).toEqual(20);
      });

      it('uses the ceiling of the result', () => {
        const root = renderPaginate({ count: 101, perPage: 5 });
        expect(root.pageCount()).toEqual(21);
      });

      it('can handle a count of zero', () => {
        const root = renderPaginate({ count: 0 });
        expect(root.pageCount()).toEqual(0);
      });

      it('does not allow a per page value of zero', () => {
        expect(() => renderPaginate({ count: 5, perPage: 0 })).toThrowError(
          /0 is not allowed/
        );
      });

      it('does not allow a negative per page value', () => {
        expect(() => renderPaginate({ count: 5, perPage: -1 })).toThrowError(
          /-1 is not allowed/
        );
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
          expect(
            getVisiblePages({ count: 30, perPage: 3, currentPage: 1 })
          ).toEqual([]);
        });

        it('will not be less than 0', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 1 });
          expect(pages).toEqual([1, 2, 3, 4, 5]);
        });

        it('will not offset near the start', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 2 });
          expect(pages).toEqual([1, 2, 3, 4, 5]);
        });

        it('will offset near the middle', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 5 });
          expect(pages).toEqual([3, 4, 5, 6, 7]);
        });

        it('will offset more near the end', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 9 });
          expect(pages).toEqual([6, 7, 8, 9, 10]);
        });

        it('will not offset more than showPages', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 10 });
          expect(pages).toEqual([6, 7, 8, 9, 10]);
        });
      });

      describe('with few pages', () => {
        const commonParams = { count: 30, perPage: 10, showPages: 5 };

        it('will not be less than 0', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 1 });
          expect(pages).toEqual([1, 2, 3]);
        });

        it('will not offset near the middle', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 2 });
          expect(pages).toEqual([1, 2, 3]);
        });

        it('will not offset near the end', () => {
          const pages = getVisiblePages({
            count: 128,
            perPage: 25,
            showPages: 9,
            currentPage: 6,
          });
          expect(pages).toEqual([1, 2, 3, 4, 5, 6]);
        });

        it('will not offset more than showPages', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 3 });
          expect(pages).toEqual([1, 2, 3]);
        });

        it('will not render when showPages is false-y', () => {
          const pages = getVisiblePages({
            ...commonParams,
            currentPage: 3,
            showPages: 0,
          });
          expect(pages).toEqual([]);
        });

        it('will not render when showPages is false', () => {
          const pages = getVisiblePages({
            ...commonParams,
            currentPage: 3,
            showPages: false,
          });
          expect(pages).toEqual([]);
        });
      });
    });

    describe('with one page', () => {
      const commonParams = { count: 3, perPage: 10, showPages: 5 };

      it('will not render if there is only one page', () => {
        const root = findDOMNode(renderPaginate({ ...commonParams }));
        expect(root).toEqual(null);
      });

      it('will render with more than one page', () => {
        const root = findDOMNode(
          renderPaginate({ ...commonParams, count: 30 })
        );
        expect(root.classList.contains('Paginate')).toBeTruthy();
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
    expect(links[0].props.LinkComponent).toEqual(LinkComponent);
    expect(links[0].props.queryParams).toEqual(queryParams);
    expect(links[0].props.currentPage).toEqual(currentPage);
    expect(links[0].props.pathname).toEqual(pathname);
    expect(links[0].props.pageCount).toEqual(pageCount);
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
      return new Promise(resolve => {
        const node = document.createElement('div');
        render(
          <Router history={createMemoryHistory('/')}>
            <Route path="/" component={PaginateWrapper} />
          </Router>,
          node,
          () => {
            resolve(node);
          }
        );
      });
    }

    return renderPaginateRoute().then(root => {
      const links = Array.from(root.querySelectorAll('a'));
      expect(
        links.map(link => [link.textContent, link.getAttribute('href')])
      ).toEqual([
        ['Previous', '/some-path/?page=4'],
        ['3', '/some-path/?page=3'],
        ['4', '/some-path/?page=4'],
        ['6', '/some-path/?page=6'],
        ['7', '/some-path/?page=7'],
        ['Next', '/some-path/?page=6'],
      ]);
    });
  });
});
