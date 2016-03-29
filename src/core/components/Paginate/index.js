import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import './Paginate.scss';

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
    const pageLinkCount = Math.min(showPages, pageCount);
    // Offset should be a number between 0 and showPages. When near the middle it will be
    // `showPages / 2`, when near the beginning it will be near 0, when near then end it will be
    // near `showPages`.
    const offset = Math.max(
      // Limit the offset when near the start to `currentPage - 1`, otherwise use `showPages / 2`.
      Math.min(Math.floor(showPages / 2), currentPage - 1),
      // When near the end the offset should approach `showPages`, but not if we have fewer pages
      // than `showPages`.
      showPages < pageCount ? showPages - (pageCount - currentPage) - 1 : 0);
    // Construct an array of visible page numbers.
    const pages = new Array(pageLinkCount);
    for (let i = 0; i < pageLinkCount; i++) {
      pages[i] = i + currentPage - offset;
    }
    return pages;
  }

  makeLink({ currentPage, page, pathname, query, text }) {
    let child;
    if (currentPage === page || page < 1 || page > this.pageCount()) {
      child = text || page;
    } else {
      const newQuery = Object.assign({page}, query);
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
