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
    count: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    i18n: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.object,
    perPage: PropTypes.number,
    showPages: PropTypes.number,
  }

  static defaultProps = {
    perPage: 20,
    query: {},
    showPages: 9,
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

  makeLink({ currentPage, page, pathname, query, text, className }) {
    if (currentPage === page || page < 1 || page > this.pageCount()) {
      return (
        <span key={page}
          className={classNames('Paginator-item', 'disabled', className)}>
          {text || page}
        </span>
      );
    }

    const newQuery = { ...query, page };
    return (
      <Link to={{ pathname, query: newQuery }}
        className={classNames('Paginator-item', className)}>
        {text || page}
      </Link>
    );
  }

  render() {
    if (this.pageCount() === 1) {
      return null;
    }

    const { currentPage, i18n, pathname, query } = this.props;

    return (
      <div className="Paginator">
        <div className="Paginator-page-number">
          {i18n.sprintf(
            i18n.gettext('Page %(currentPage)s of %(totalPages)s'),
            { currentPage, totalPages: this.pageCount() }
          )}
        </div>
        <div className="Paginator-links">
          {this.makeLink({ page: currentPage - 1, currentPage, pathname, query, text: i18n.gettext('Previous'), className: 'Paginator-previous' })}
          {this.visiblePages().map((page) => this.makeLink({ page, currentPage, pathname, query }))}
          {this.makeLink({ page: currentPage + 1, currentPage, pathname, query, text: i18n.gettext('Next'), className: 'Paginator-next' })}
        </div>
      </div>
    );
  }
}

export default translate({ withRef: true })(PaginateBase);
