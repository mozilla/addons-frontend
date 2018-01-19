import makeClassName from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';


export default class PaginatorLink extends React.Component {
  static propTypes = {
    LinkComponent: PropTypes.func,
    className: PropTypes.string,
    currentPage: PropTypes.number.isRequired,
    pathname: PropTypes.string.isRequired,
    page: PropTypes.number.isRequired,
    pageCount: PropTypes.number.isRequired,
    queryParams: PropTypes.object,
    text: PropTypes.string,
  }

  static defaultProps = {
    LinkComponent: Link,
  }

  render() {
    const {
      className,
      currentPage,
      LinkComponent,
      page,
      pageCount,
      pathname,
      queryParams,
      text,
    } = this.props;

    if (currentPage === undefined) {
      throw new Error('The currentPage property cannot be undefined');
    }
    if (pathname === undefined) {
      throw new Error('The pathname property cannot be undefined');
    }
    if (page === undefined) {
      throw new Error('The page property cannot be undefined');
    }
    if (pageCount === undefined) {
      throw new Error('The pageCount property cannot be undefined');
    }

    if (currentPage === page || page < 1 || page > pageCount) {
      return (
        <span
          key={page}
          className={makeClassName('Paginate-item', 'disabled', className)}
        >
          {text || page}
        </span>
      );
    }

    return (
      <LinkComponent
        to={{ pathname, query: { ...queryParams, page } }}
        className={makeClassName('Paginate-item', className)}
      >
        {text || page}
      </LinkComponent>
    );
  }
}
