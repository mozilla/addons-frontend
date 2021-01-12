import * as React from 'react';

import { DEFAULT_API_PAGE_SIZE } from 'amo/api';
import Paginate, { PaginateBase } from 'amo/components/Paginate';
import PaginatorLink from 'amo/components/PaginatorLink';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  const getRenderProps = () => ({
    i18n: fakeI18n(),
    count: 20,
    currentPage: 1,
    pathname: '/some/path',
    perPage: DEFAULT_API_PAGE_SIZE,
  });

  function renderPaginate(extra = {}) {
    const props = {
      ...getRenderProps(),
      ...extra,
    };

    return shallowUntilTarget(<Paginate {...props} />, PaginateBase);
  }

  describe('methods', () => {
    describe('validation', () => {
      it('does not allow an undefined count', () => {
        expect(() => renderPaginate({ count: undefined })).toThrowError(
          /count property cannot be undefined/,
        );
      });

      it('does not allow an undefined pathname', () => {
        expect(() => renderPaginate({ pathname: undefined })).toThrowError(
          /pathname property cannot be undefined/,
        );
      });
    });

    describe('pageCount()', () => {
      it('is count / perPage', () => {
        const root = renderPaginate({ count: 100, perPage: 5 });
        expect(root.instance().pageCount()).toEqual(20);
      });

      it('uses the ceiling of the result', () => {
        const root = renderPaginate({ count: 101, perPage: 5 });
        expect(root.instance().pageCount()).toEqual(21);
      });

      it('can handle a count of zero', () => {
        const root = renderPaginate({ count: 0 });
        expect(root.instance().pageCount()).toEqual(0);
      });

      it('does not allow a per page value of zero', () => {
        expect(() => renderPaginate({ count: 5, perPage: 0 })).toThrowError(
          /0 is not allowed/,
        );
      });

      it('does not allow a negative per page value', () => {
        expect(() => renderPaginate({ count: 5, perPage: -1 })).toThrowError(
          /-1 is not allowed/,
        );
      });
    });

    describe('visiblePages()', () => {
      function getVisiblePages(customProps = {}) {
        const root = renderPaginate(customProps);

        return root.instance().visiblePages({
          pageCount: root.instance().pageCount(),
        });
      }

      describe('with lots of pages', () => {
        const commonParams = { count: 30, perPage: 3, showPages: 5 };

        it('will be 7 by default', () => {
          expect(
            getVisiblePages({ count: 30, perPage: 3, currentPage: 1 }),
          ).toEqual([1, 2, 3, 4, 5, 6, 7]);
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
            perPage: DEFAULT_API_PAGE_SIZE,
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
        const root = renderPaginate({ ...commonParams });

        expect(root.find('.Paginate')).toHaveLength(0);
      });

      it('will render with more than one page', () => {
        const root = renderPaginate({ ...commonParams, count: 30 });

        expect(root.find('.Paginate')).toHaveLength(1);
      });
    });

    describe('getCurrentPage', () => {
      const getCurrentPage = (customProps = {}) => {
        const root = renderPaginate(customProps);

        return root.instance().getCurrentPage();
      };

      it('returns the current page', () => {
        expect(getCurrentPage({ currentPage: 123 })).toEqual(123);
      });

      // This happens when passing the value of a query string parameter
      // directly to the component (highly probable).
      it('converts current page as string to number', () => {
        expect(getCurrentPage({ currentPage: 123 })).toEqual(123);
      });

      it('returns 1 when current page is invalid', () => {
        expect(getCurrentPage({ currentPage: 'abc' })).toEqual(1);
        expect(getCurrentPage({ currentPage: 0 })).toEqual(1);
        expect(getCurrentPage({ currentPage: null })).toEqual(1);
        expect(getCurrentPage({ currentPage: undefined })).toEqual(1);
      });
    });
  });

  it('passes props to paginator links', () => {
    const currentPage = 1;
    const pageCount = 3;
    const queryParams = { color: 'red' };
    const pathname = '/some/path';

    const root = renderPaginate({
      count: 3,
      currentPage,
      pathname,
      pageCount,
      perPage: 1,
      queryParams,
    });

    const firstLink = root.find(PaginatorLink).first();
    // Just do a quick sanity check on the first link.
    expect(firstLink).toHaveProp('currentPage', currentPage);
    expect(firstLink).toHaveProp('pageCount', pageCount);
    expect(firstLink).toHaveProp('pageParam', 'page');
    expect(firstLink).toHaveProp('pathname', pathname);
    expect(firstLink).toHaveProp('queryParams', queryParams);
  });

  it('defaults currentPage to 1', () => {
    const root = renderPaginate({ currentPage: undefined, count: 30 });

    const firstLink = root.find(PaginatorLink).first();
    expect(firstLink).toHaveProp('currentPage', 1);
  });

  it('converts a null currentPage to 1', () => {
    const root = renderPaginate({ currentPage: null, count: 30 });

    const firstLink = root.find(PaginatorLink).first();
    expect(firstLink).toHaveProp('currentPage', 1);
  });

  it('converts a non-numeric currentPage to 1', () => {
    const root = renderPaginate({ currentPage: 'abc', count: 30 });

    const firstLink = root.find(PaginatorLink).first();
    expect(firstLink).toHaveProp('currentPage', 1);
  });

  it('converts a negative currentPage to 1', () => {
    const root = renderPaginate({ currentPage: -5, count: 30 });

    const firstLink = root.find(PaginatorLink).first();
    expect(firstLink).toHaveProp('currentPage', 1);
  });

  it('passes `pageParam` to paginator links if supplied', () => {
    const pageParam = 'my-page-filter';
    const root = renderPaginate({ count: 50, pageParam });

    const firstLink = root.find(PaginatorLink).first();
    expect(firstLink).toHaveProp('pageParam', pageParam);
  });
});
