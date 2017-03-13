import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';


export default class PaginatorLink extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    currentPage: PropTypes.number.isRequired,
    pathname: PropTypes.string.isRequired,
    page: PropTypes.number.isRequired,
    pageCount: PropTypes.number,
    queryParams: PropTypes.object,
    text: PropTypes.string,
  }

  render() {
    const {
      className,
      currentPage,
      page,
      pageCount,
      pathname,
      queryParams,
      text,
    } = this.props;

    if (currentPage === page || page < 1 || page > pageCount) {
      // TODO: move styles into this component too
      return (
        <span key={page}
          className={classNames('Paginator-item', 'disabled', className)}>
          {text || page}
        </span>
      );
    }

    return (
      <Link to={{ pathname, query: { ...queryParams, page } }}
        className={classNames('Paginator-item', className)}>
        {text || page}
      </Link>
    );
  }
}
