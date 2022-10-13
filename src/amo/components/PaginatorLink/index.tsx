import url from 'url';

import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import PropTypes from 'prop-types';

import Button from 'amo/components/Button';

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
    invariant(currentPage !== undefined, 'The currentPage property cannot be undefined');
    invariant(pathname !== undefined, 'The pathname property cannot be undefined');
    invariant(page !== undefined, 'The page property cannot be undefined');
    invariant(pageCount !== undefined, 'The pageCount property cannot be undefined');
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
      return <Button buttonType="cancel" className={classNames} disabled key={page}>
          {text || page}
        </Button>;
    }

    const parsedPath = url.parse(pathname, true);
    return <Button
      buttonType="cancel"
      className={makeClassName('Paginate-item', className)}
      rel={rel}
      to={{
      pathname: parsedPath.pathname,
      query: { ...parsedPath.query,
        ...queryParams,
        [pageParam]: page,
      },
    }}
    >
        {text || page}
      </Button>;
  }

}