/* global document */
import React from 'react';

import Paginate, { PaginateBase } from 'core/components/Paginate';
import PaginatorLink from 'core/components/PaginatorLink';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


describe('<Paginate />', () => {
  const getRenderProps = () => ({
    i18n: fakeI18n(),
    count: 20,
    currentPage: 1,
    pathname: '/some/path',
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
        expect(() => renderPaginate({ count: undefined }))
          .toThrowError(/count property cannot be undefined/);
      });

      it('does not allow an undefined currentPage', () => {
        expect(() => renderPaginate({ currentPage: undefined }))
          .toThrowError(/currentPage property cannot be undefined/);
      });

      it('does not allow an undefined pathname', () => {
        expect(() => renderPaginate({ pathname: undefined }))
          .toThrowError(/pathname property cannot be undefined/);
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
        expect(() => renderPaginate({ count: 5, perPage: 0 }))
          .toThrowError(/0 is not allowed/);
      });

      it('does not allow a negative per page value', () => {
        expect(() => renderPaginate({ count: 5, perPage: -1 }))
          .toThrowError(/-1 is not allowed/);
      });
    });

    describe('visiblePages()', () => {
      function getVisiblePages(customProps = {}) {
        const root = renderPaginate(customProps);
        return root.instance().visiblePages({ pageCount: root.instance().pageCount() });
      }

      describe('with lots of pages', () => {
        const commonParams = { count: 30, perPage: 3, showPages: 5 };

        it('will be 0 by default', () => {
          expect(getVisiblePages({ count: 30, perPage: 3, currentPage: 1 })).toEqual([]);
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
            count: 128, perPage: 25, showPages: 9, currentPage: 6,
          });
          expect(pages).toEqual([1, 2, 3, 4, 5, 6]);
        });

        it('will not offset more than showPages', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 3 });
          expect(pages).toEqual([1, 2, 3]);
        });

        it('will not render when showPages is false-y', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 3, showPages: 0 });
          expect(pages).toEqual([]);
        });

        it('will not render when showPages is false', () => {
          const pages = getVisiblePages({ ...commonParams, currentPage: 3, showPages: false });
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
    expect(firstLink).toHaveProp('queryParams', queryParams);
    expect(firstLink).toHaveProp('currentPage', currentPage);
    expect(firstLink).toHaveProp('pathname', pathname);
    expect(firstLink).toHaveProp('pageCount', pageCount);
  });
});
