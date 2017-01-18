import classNames from 'classnames';
import React, { PropTypes } from 'react';

import { makeQueryString } from 'core/api';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import Link from 'amo/components/Link';

import './SearchSortLink.scss';


export function queryString(filters) {
  return makeQueryString(convertFiltersToQueryParams(filters));
}

export default class SearchSortLink extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    currentSort: PropTypes.string.isRequired,
    filters: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
    sort: PropTypes.string.isRequired,
  }

  render() {
    const { children, currentSort, filters, pathname, sort } = this.props;
    const sortURL = `/${pathname}/${queryString({ ...filters, sort })}`;

    return (
      <Link to={sortURL} className={classNames('SearchSortLink', {
        'SearchSortLink--active': currentSort === sort,
      })}>
        {children}
      </Link>
    );
  }
}
