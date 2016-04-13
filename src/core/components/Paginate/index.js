import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import './Paginate.scss';

function makePageNumbers({start, end}) {
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export default class Paginate extends React.Component {
  static propTypes = {
    count: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.object,
    perPage: PropTypes.number,
    showPages: PropTypes.number,
  }

  static defaultProps = {
    perPage: 25,
    query: {},
    showPages: 9,
  }

  pageCount() {
    return Math.ceil(this.props.count / this.props.perPage);
  }

  visiblePages() {
    const { currentPage, showPages } = this.props;
    const pageCount = this.pageCount();
    const showExtra = Math.floor(showPages / 2);
    const start = Math.max(1, currentPage - showExtra);
    const end = Math.min(pageCount, currentPage + showExtra);

    // If we can show all of the pages, show them all.
    if (pageCount <= showPages) {
      return makePageNumbers({start: 1, end: pageCount});
    // If we are showing less on the right than we should, define the start by the end.
    } else if (end - currentPage < showExtra) {
        return makePageNumbers({start: end - showPages + 1, end});
    // If we are showing less on the left than we should, define the end by the start.
    } else if (currentPage - start < showExtra) {
        return makePageNumbers({start, end: start + showPages - 1});
    }
    // We're showing the maximum number of pages on each side, start and end are correct.
    return makePageNumbers({start, end});
  }

  makeLink({ currentPage, page, pathname, query, text }) {
    let child;
    if (currentPage === page || page < 1 || page > this.pageCount()) {
      child = text || page;
    } else {
      const newQuery = {page, ...query};
      child = <Link to={{pathname, query: newQuery}}>{text || page}</Link>;
    }
    return <li key={page} className="paginator--item">{child}</li>;
  }

  render() {
    const { currentPage, pathname, query } = this.props;
    return (
      <ul className="paginator">
        {this.makeLink({page: currentPage - 1, currentPage, pathname, query, text: 'Prev'})}
        {this.visiblePages().map((page) => this.makeLink({page, currentPage, pathname, query}))}
        {this.makeLink({page: currentPage + 1, currentPage, pathname, query, text: 'Next'})}
      </ul>
    );
  }
}
