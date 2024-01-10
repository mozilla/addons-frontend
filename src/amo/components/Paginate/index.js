/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import PaginatorLink from 'amo/components/PaginatorLink';
import translate from 'amo/i18n/translate';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type DefaultProps = {|
  pageParam?: string,
  showPages?: number,
|};

type Props = {|
  ...DefaultProps,
  LinkComponent: React.Node,
  count: number,
  currentPage?: string,
  pathname?: string,
  perPage: number,
  queryParams?: Object,
  receivedPageCount?: number,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

function makePageNumbers({
  start,
  end,
}: {|
  start: number,
  end: number,
|}): Array<number> {
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export const getPageCount = ({
  count,
  perPage,
}: {|
  count: number,
  perPage: number,
|}): number => {
  invariant(typeof perPage === 'number', 'perPage is required');
  invariant(perPage > 0, `A perPage value of ${perPage} is not allowed`);

  return Math.ceil(count / perPage);
};

export const getCurrentPage = (currentPage?: string): number => {
  const thePage = parseInt(currentPage, 10);

  return Number.isNaN(thePage) || thePage < 1 ? 1 : thePage;
};

export const getVisiblePages = ({
  currentPage,
  pageCount,
  showPages,
}: {|
  currentPage?: string,
  pageCount: number,
  showPages?: number,
|}): Array<number> => {
  if (!showPages) {
    return [];
  }

  const thisPage = getCurrentPage(currentPage);
  const showExtra = Math.floor(showPages / 2);
  const start = Math.max(1, thisPage - showExtra);
  const end = Math.min(pageCount, thisPage + showExtra);

  // If we can show all of the pages, show them all.
  if (pageCount <= showPages) {
    return makePageNumbers({ start: 1, end: pageCount });
    // If we are showing less on the right than we should, define the start by
    // the end.
  }
  if (end - thisPage < showExtra) {
    return makePageNumbers({ start: end - showPages + 1, end });
    // If we are showing less on the left than we should, define the end by the
    // start.
  }
  if (thisPage - start < showExtra) {
    return makePageNumbers({ start, end: start + showPages - 1 });
  }

  // We're showing the maximum number of pages on each side, start and end
  // are correct.
  return makePageNumbers({ start, end });
};

export class PaginateBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    pageParam: 'page',
    showPages: 7,
  };

  render(): null | React.Node {
    const {
      LinkComponent,
      count,
      currentPage,
      i18n,
      pageParam,
      pathname,
      perPage,
      queryParams,
      showPages,
      receivedPageCount,
    } = this.props;

    const pageCount: number =
      receivedPageCount || getPageCount({ count, perPage });

    const thisPage = getCurrentPage(currentPage);

    invariant(count !== undefined, 'The count property cannot be undefined');
    invariant(
      pathname !== undefined,
      'The pathname property cannot be undefined',
    );
    if (pageCount === 1) {
      return null;
    }

    const linkParams = {
      LinkComponent,
      currentPage: thisPage,
      pageCount,
      pathname,
      queryParams,
    };

    return (
      /* eslint-disable react/no-array-index-key */
      <div className="Paginate">
        <div className="Paginate-links">
          <PaginatorLink
            {...linkParams}
            className="Paginate-item--previous"
            page={thisPage - 1}
            pageParam={pageParam}
            text={i18n.t('Previous')}
          />

          {getVisiblePages({ currentPage, pageCount, showPages }).map(
            (page) => (
              <PaginatorLink
                {...linkParams}
                key={`page-${page}`}
                page={page}
                pageParam={pageParam}
              />
            ),
          )}

          <PaginatorLink
            {...linkParams}
            className="Paginate-item--next"
            page={thisPage + 1}
            pageParam={pageParam}
            text={i18n.t('Next')}
          />
        </div>

        <div className="Paginate-page-number">
          {i18n.t('Page %(thisPage)s of %(totalPages)s', {
            thisPage,
            totalPages: pageCount,
          })}
        </div>
      </div>
    );
  }
}

const Paginate: React.ComponentType<Props> = compose(translate())(PaginateBase);

export default Paginate;
