import React, { PropTypes } from 'react';

import './Paginate.scss';

export default class Paginate extends React.Component {
  static propTypes = {
    count: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    pager: PropTypes.func.isRequired,
    perPage: PropTypes.number,
    showPages: PropTypes.number,
  }

  static defaultProps = {
    perPage: 25,
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
    // `showPages / 2`, when near the begging it will be near 0, when near then end it will be near
    // `showPages`.
    const offset = Math.max(
      // Limit the offset when near the start to `currentPage - 1`, otherwise use `showPages / 2`.
      Math.min(Math.floor(showPages / 2), currentPage - 1),
      // When near the end the offset should approach `showPages`, but not if we have fewer pages
      // than `showPages`.
      showPages < pageCount ? showPages - (pageCount - currentPage) - 1 : 0);
    return new Array(pageLinkCount).fill(0).map((val, i) => i + currentPage - offset);
  }

  makeLink({ currentPage, page, pager, text }) {
    const goToPage = (e) => {
      e.preventDefault();
      pager(page);
    };
    let child;
    if (currentPage === page || page < 1 || page > this.pageCount()) {
      child = text || page;
    } else {
      child = <a href="#" onClick={goToPage}>{text || page}</a>;
    }
    return <li key={page} className="paginator--item">{child}</li>;
  }

  render() {
    const { currentPage, pager } = this.props;
    return (
      <ul className="paginator">
        {this.makeLink({page: currentPage - 1, currentPage, pager, text: 'Prev'})}
        {this.visiblePages().map((page) => this.makeLink({page, currentPage, pager}))}
        {this.makeLink({page: currentPage + 1, currentPage, pager, text: 'Next'})}
      </ul>
    );
  }
}
