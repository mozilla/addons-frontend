import * as React from 'react';

import { DEFAULT_API_PAGE_SIZE } from 'amo/api';
import Paginate, { getCurrentPage, getPageCount, getVisiblePages } from 'amo/components/Paginate';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const getRenderProps = () => ({
    count: 20,
    currentPage: 1,
    pathname: '/some/path',
    perPage: DEFAULT_API_PAGE_SIZE,
  });

  function render(extra = {}) {
    const props = { ...getRenderProps(),
      ...extra,
    };
    return defaultRender(<Paginate {...props} />);
  }

  describe('methods', () => {
    describe('getPageCount()', () => {
      it('is count / perPage', () => {
        expect(getPageCount({
          count: 100,
          perPage: 5,
        })).toEqual(20);
      });
      it('uses the ceiling of the result', () => {
        expect(getPageCount({
          count: 101,
          perPage: 5,
        })).toEqual(21);
      });
      it('can handle a count of zero', () => {
        expect(getPageCount({
          count: 0,
          perPage: DEFAULT_API_PAGE_SIZE,
        })).toEqual(0);
      });
    });
    describe('visiblePages()', () => {
      describe('with lots of pages', () => {
        const commonParams = {
          pageCount: getPageCount({
            count: 30,
            perPage: 3,
          }),
          showPages: 5,
        };
        it('will not be less than 0', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 1,
          });
          expect(pages).toEqual([1, 2, 3, 4, 5]);
        });
        it('will not offset near the start', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 2,
          });
          expect(pages).toEqual([1, 2, 3, 4, 5]);
        });
        it('will offset near the middle', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 5,
          });
          expect(pages).toEqual([3, 4, 5, 6, 7]);
        });
        it('will offset more near the end', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 9,
          });
          expect(pages).toEqual([6, 7, 8, 9, 10]);
        });
        it('will not offset more than showPages', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 10,
          });
          expect(pages).toEqual([6, 7, 8, 9, 10]);
        });
      });
      describe('with few pages', () => {
        const commonParams = {
          pageCount: getPageCount({
            count: 30,
            perPage: 10,
          }),
          showPages: 5,
        };
        it('will not be less than 0', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 1,
          });
          expect(pages).toEqual([1, 2, 3]);
        });
        it('will not offset near the middle', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 2,
          });
          expect(pages).toEqual([1, 2, 3]);
        });
        it('will not offset near the end', () => {
          const pages = getVisiblePages({
            pageCount: getPageCount({
              count: 128,
              perPage: DEFAULT_API_PAGE_SIZE,
            }),
            showPages: 9,
            currentPage: 6,
          });
          expect(pages).toEqual([1, 2, 3, 4, 5, 6]);
        });
        it('will not offset more than showPages', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 3,
          });
          expect(pages).toEqual([1, 2, 3]);
        });
        it('will not render when showPages is false-y', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 3,
            showPages: 0,
          });
          expect(pages).toEqual([]);
        });
        it('will not render when showPages is false', () => {
          const pages = getVisiblePages({ ...commonParams,
            currentPage: 3,
            showPages: false,
          });
          expect(pages).toEqual([]);
        });
      });
    });
    describe('with one page', () => {
      const commonParams = {
        count: 3,
        perPage: 10,
        showPages: 5,
      };
      it('will not render if there is only one page', () => {
        render({ ...commonParams,
        });
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
      });
      it('will render with more than one page', () => {
        render({ ...commonParams,
          count: 30,
        });
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });
    describe('getCurrentPage', () => {
      it('returns the current page', () => {
        expect(getCurrentPage(123)).toEqual(123);
      });
      // This happens when passing the value of a query string parameter
      // directly to the component (highly probable).
      it('converts current page as string to number', () => {
        expect(getCurrentPage(123)).toEqual(123);
      });
      it('returns 1 when current page is invalid', () => {
        expect(getCurrentPage('abc')).toEqual(1);
        expect(getCurrentPage(0)).toEqual(1);
        expect(getCurrentPage(null)).toEqual(1);
        expect(getCurrentPage(undefined)).toEqual(1);
      });
    });
  });
  it('passes props to paginator links', () => {
    const currentPage = 2;
    const pageCount = 3;
    const queryParams = {
      color: 'red',
    };
    const pathname = '/some/path';
    render({
      count: 3,
      currentPage,
      pathname,
      pageCount,
      perPage: 1,
      queryParams,
    });
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('link', {
      name: 'Next',
    })).toHaveAttribute('href', `/en-US/android${pathname}?color=red&page=3`);
  });
  it('defaults currentPage to 1', () => {
    render({
      currentPage: undefined,
      count: 30,
    });
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
  it('converts a null currentPage to 1', () => {
    render({
      currentPage: null,
      count: 30,
    });
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
  it('converts a non-numeric currentPage to 1', () => {
    render({
      currentPage: 'abc',
      count: 30,
    });
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
  it('converts a negative currentPage to 1', () => {
    render({
      currentPage: -5,
      count: 30,
    });
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
  it('passes `pageParam` to paginator links if supplied', () => {
    const pageParam = 'my-page-filter';
    render({
      count: 50,
      pageParam,
    });
    expect(screen.getByRole('link', {
      name: 'Next',
    })).toHaveAttribute('href', `/en-US/android/some/path?${pageParam}=2`);
  });
  describe('Tests for PaginatorLink', () => {
    it('passes className to Button', () => {
      render({
        count: 30,
      });
      expect(screen.getByRole('link', {
        name: 'Next',
      })).toHaveClass('Paginate-item--next');
    });
    it('handles `pathname` with a search string at the end', () => {
      const pathnameBase = '/somewhere/';
      const color = 'purple';
      const pathname = `${pathnameBase}?color=${color}`;
      render({
        count: 30,
        pathname,
      });
      expect(screen.getByRole('link', {
        name: 'Next',
      })).toHaveAttribute('href', `/en-US/android${pathname}&page=2`);
    });
    describe('when the link is to the current page', () => {
      it('does not contain a link and is disabled', () => {
        render({
          count: 30,
          currentPage: 2,
        });
        const link = screen.getByRole('button', {
          name: '2',
        });
        expect(link).toHaveClass('Paginate-item--current-page');
        expect(link).toBeDisabled();
      });
    });
    describe('when the link is to a different page', () => {
      it('renders a button with a to prop (creates a link)', () => {
        render({
          count: 30,
          currentPage: 1,
        });
        const link = screen.getByRole('link', {
          name: '2',
        });
        expect(link).not.toHaveClass('Paginate-item--current-page');
        expect(link).toHaveAttribute('href', '/en-US/android/some/path?page=2');
      });
    });
    it('assigns a `rel` attribute as expected', () => {
      render({
        count: 120,
        currentPage: 3,
      });
      // It adds a rel="prev" attribute when it is the immediate preceding page.
      expect(screen.getByRole('link', {
        name: '2',
      })).toHaveAttribute('rel', 'prev');
      // It adds a rel="next" attribute when it is the immediate next page.
      expect(screen.getByRole('link', {
        name: '4',
      })).toHaveAttribute('rel', 'next');
      // It does not add a rel attribute when the page is the current page.
      expect(screen.getByRole('button', {
        name: '3',
      })).not.toHaveAttribute('rel');
      // It does not add a rel attribute when the page is not the immediate preceding page.
      expect(screen.getByRole('link', {
        name: '1',
      })).not.toHaveAttribute('rel');
      // It does not add a rel attribute when the page is not the immediate next page.
      expect(screen.getByRole('link', {
        name: '5',
      })).not.toHaveAttribute('rel');
    });
  });
});