import React, { PropTypes } from 'react';

import Paginate from 'core/components/Paginate';
import { gettext as _ } from 'core/utils';

import SearchForm from './SearchForm';
import SearchResults from './SearchResults';

export default class SearchPage extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    location: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    results: PropTypes.arrayOf(PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })),
    query: PropTypes.string,
  }

  static contextTypes = {
    router: PropTypes.object.isRequired,
  }

  componentDidMount() {
    const { location, query } = this.props;
    const { router } = this.context;
    const url = {
      ...location,
      query: { ...location.query, q: query },
    };
    if (query && !router.isActive(url)) {
      router.replace(url);
    }
  }

  render() {
    const { count, loading, page, query, results } = this.props;
    const pathname = '/search/';
    const paginator = query && count > 0 ?
      <Paginate count={count} pathname={pathname} query={{ q: query }} currentPage={page} /> : [];
    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm pathname={pathname} query={query} />
        {paginator}
        <SearchResults results={results} query={query} loading={loading} count={count} />
      </div>
    );
  }
}
