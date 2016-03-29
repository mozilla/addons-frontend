import React, { PropTypes } from 'react';

import Paginate from 'core/components/Paginate';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import { gettext as _ } from 'core/utils';

import 'search/css/SearchPage.scss';

export default class SearchPage extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    handleSearch: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    results: PropTypes.arrayOf(PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })),
    query: PropTypes.string,
  }

  pager = (page) => {
    this.props.handleSearch(this.props.query, page);
  }

  render() {
    const { count, handleSearch, loading, page, query, results } = this.props;
    const paginator = query && count > 0 ?
      <Paginate count={count} pager={this.pager} currentPage={page} /> : [];
    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm onSearch={handleSearch} />
        {paginator}
        <SearchResults results={results} query={query} loading={loading} count={count} />
      </div>
    );
  }
}
