import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';

import Button from 'ui/components/Button';

export default class PaginatorLink extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    currentPage: PropTypes.number.isRequired,
    page: PropTypes.number.isRequired,
    pageCount: PropTypes.number.isRequired,
    pageParam: PropTypes.string,
    pathname: PropTypes.string.isRequired,
    queryParams: PropTypes.object,
    text: PropTypes.string,
  };

  static defaultProps = {
    pageParam: 'page',
  };

  render() {
    const {
      className,
      currentPage,
      page,
      pageCount,
      pageParam,
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

    let rel = null;
    if (page + 1 === currentPage) {
      rel = 'prev';
    } else if (page - 1 === currentPage) {
      rel = 'next';
    }

    if (currentPage === page || page < 1 || page > pageCount) {
      const classNames = makeClassName('Paginate-item', className, {
        'Paginate-item--current-page': currentPage === page,
      });

      return (
        <Button buttonType="cancel" className={classNames} disabled key={page}>
          {text || page}
        </Button>
      );
    }

    return (
      <Button
        buttonType="cancel"
        className={makeClassName('Paginate-item', className)}
        rel={rel}
        to={{ pathname, query: { ...queryParams, [pageParam]: page } }}
      >
        {text || page}
      </Button>
    );
  }
}
