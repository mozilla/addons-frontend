import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';


export default class PaginatorLink extends React.Component {
  static propTypes = {
    LinkComponent: PropTypes.object,
    className: PropTypes.string,
    currentPage: PropTypes.number.isRequired,
    pathname: PropTypes.string.isRequired,
    page: PropTypes.number.isRequired,
    pageCount: PropTypes.number,
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

    if (currentPage === page || page < 1 || page > pageCount) {
      return (
        <span key={page}
          className={classNames('Paginate-item', 'disabled', className)}>
          {text || page}
        </span>
      );
    }

    return (
      <LinkComponent to={{ pathname, query: { ...queryParams, page } }}
        className={classNames('Paginate-item', className)}>
        {text || page}
      </LinkComponent>
    );
  }
}
