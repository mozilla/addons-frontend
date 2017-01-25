import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import translate from 'core/i18n/translate';

import './Paginate.scss';


function makePageNumbers({ start, end }) {
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export class PaginateBase extends React.Component {
  static propTypes = {
    LinkComponent: PropTypes.object.isRequired,
    count: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    i18n: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
    perPage: PropTypes.number,
    queryParams: PropTypes.object,
    showPages: PropTypes.number,
  }

  static defaultProps = {
    LinkComponent: Link,
    perPage: 20,
    showPages: 0,
  }

  pageCount() {
    return Math.ceil(this.props.count / this.props.perPage);
  }

  visiblePages() {
    const { currentPage, showPages } = this.props;
    if (!showPages) {
      return [];
    }

    const pageCount = this.pageCount();
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

  makeLink({ className, currentPage, page, pathname, queryParams, text }) {
    const { LinkComponent } = this.props;

    if (currentPage === page || page < 1 || page > this.pageCount()) {
      return (
        <span key={page}
          className={classNames('Paginator-item', 'disabled', className)}>
          {text || page}
        </span>
      );
    }

    return (
      <LinkComponent to={{ pathname, query: { ...queryParams, page } }}
        className={classNames('Paginator-item', className)}>
        {text || page}
      </LinkComponent>
    );
  }

  render() {
    if (this.pageCount() === 1) {
      return null;
    }

    const { currentPage, i18n, pathname, queryParams } = this.props;

    return (
      <div className="Paginator">
        <div className="Paginator-page-number">
          {i18n.sprintf(
            i18n.gettext('Page %(currentPage)s of %(totalPages)s'),
            { currentPage, totalPages: this.pageCount() }
          )}
        </div>
        <div className="Paginator-links">
          {this.makeLink({
            className: 'Paginator-previous',
            currentPage,
            page: currentPage - 1,
            pathname,
            queryParams,
            text: i18n.gettext('Previous'),
          })}
          {this.visiblePages().map((page) => (
            this.makeLink({ currentPage, page, pathname, queryParams }
          )))}
          {this.makeLink({
            className: 'Paginator-next',
            currentPage,
            page: currentPage + 1,
            pathname,
            queryParams,
            text: i18n.gettext('Next'),
          })}
        </div>
      </div>
    );
  }
}

export default translate({ withRef: true })(PaginateBase);
