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

export class PaginatorLink extends React.Component {
  render() {
    const {
      LinkComponent = Link,
      className,
      currentPage,
      page,
      pageCount,
      pathname,
      queryParams,
      text
    } = this.props;

    if (currentPage === page || page < 1 || page > pageCount) {
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
}

export class PaginateBase extends React.Component {
  static propTypes = {
    LinkComponent: PropTypes.object,
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
    perPage: 25, // The default number of results per page returned by the API.
    showPages: 0,
  }

  pageCount() {
    const { count, perPage } = this.props;
    if (perPage <= 0) {
      throw new TypeError(`A perPage value of ${perPage} is not allowed`);
    }
    return Math.ceil(count / perPage);
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
    const { count, currentPage, i18n, pathname, queryParams } = this.props;

    if (count === undefined) {
      throw new Error('The count property cannot be undefined');
    }
    if (currentPage === undefined) {
      throw new Error('The currentPage property cannot be undefined');
    }
    if (pathname === undefined) {
      throw new Error('The pathname property cannot be undefined');
    }
    if (this.pageCount() === 1) {
      return null;
    }

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
