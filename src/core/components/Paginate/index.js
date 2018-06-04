import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import PaginatorLink from 'core/components/PaginatorLink';
import translate from 'core/i18n/translate';

import './styles.scss';


function makePageNumbers({ start, end }) {
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export class PaginateBase extends React.Component {
  static propTypes = {
    LinkComponent: PropTypes.func,
    count: PropTypes.number.isRequired,
    currentPage: PropTypes.number,
    i18n: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
    perPage: PropTypes.number,
    queryParams: PropTypes.object,
    showPages: PropTypes.number,
  }

  static defaultProps = {
    perPage: DEFAULT_API_PAGE_SIZE,
    showPages: 0,
  }

  pageCount() {
    const { count, perPage } = this.props;
    if (perPage <= 0) {
      throw new TypeError(`A perPage value of ${perPage} is not allowed`);
    }
    return Math.ceil(count / perPage);
  }

  visiblePages({ pageCount }) {
    const { currentPage, showPages } = this.props;
    if (!showPages) {
      return [];
    }

    const showExtra = Math.floor(showPages / 2);
    const start = Math.max(1, currentPage - showExtra);
    const end = Math.min(pageCount, currentPage + showExtra);

    // If we can show all of the pages, show them all.
    if (pageCount <= showPages) {
      return makePageNumbers({ start: 1, end: pageCount });
    // If we are showing less on the right than we should, define the start by the end.
    } else if (end - currentPage < showExtra) {
      return makePageNumbers({ start: (end - showPages) + 1, end });
    // If we are showing less on the left than we should, define the end by the start.
    } else if (currentPage - start < showExtra) {
      return makePageNumbers({ start, end: (start + showPages) - 1 });
    }
    // We're showing the maximum number of pages on each side, start and end are correct.
    return makePageNumbers({ start, end });
  }

  render() {
    const {
      LinkComponent, count, currentPage, i18n, pathname, queryParams,
    } = this.props;
    const pageCount = this.pageCount();
    let pageNumber = parseInt(currentPage, 10);
    pageNumber = Number.isNaN(pageNumber) || pageNumber < 1 ? 1 : pageNumber;

    if (count === undefined) {
      throw new Error('The count property cannot be undefined');
    }
    if (pathname === undefined) {
      throw new Error('The pathname property cannot be undefined');
    }
    if (this.pageCount() === 1) {
      return null;
    }

    const linkParams = {
      LinkComponent,
      currentPage: pageNumber,
      pathname,
      pageCount,
      queryParams,
    };

    return (
      /* eslint-disable react/no-array-index-key */
      <div className="Paginate">
        <div className="Paginate-page-number">
          {i18n.sprintf(
            i18n.gettext('Page %(pageNumber)s of %(totalPages)s'),
            { pageNumber, totalPages: this.pageCount() }
          )}
        </div>
        <div className="Paginate-links">
          <PaginatorLink
            {...linkParams}
            className="Paginate-previous"
            page={pageNumber - 1}
            text={i18n.gettext('Previous')}
          />
          {this.visiblePages({ pageCount }).map((page) => (
            <PaginatorLink
              {...linkParams}
              key={`page-${page}`}
              page={page}
            />
          ))}
          <PaginatorLink
            {...linkParams}
            className="Paginate-next"
            page={pageNumber + 1}
            text={i18n.gettext('Next')}
          />
        </div>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(PaginateBase);
