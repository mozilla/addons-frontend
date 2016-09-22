import React, { PropTypes } from 'react';

import Paginate from 'core/components/Paginate';
import { gettext as _ } from 'core/utils';
import SearchResults from 'core/components/Search/SearchResults';

import SearchForm from './SearchForm';
import SearchResult from './SearchResult';


export default class SearchPage extends React.Component {
  static propTypes = {
    count: PropTypes.number,
    lang: PropTypes.string.isRequired,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    results: PropTypes.array,
    query: PropTypes.string,
  }

  render() {
    const { count, lang, loading, page, query, results } = this.props;
    const pathname = `/${lang}/firefox/search/`;
    const paginator = query && count > 0 ?
      <Paginate count={count} pathname={pathname} query={{ q: query }} currentPage={page} /> : [];
    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm pathname={pathname} query={query} />
        {paginator}
        <SearchResults results={results} query={query} loading={loading}
          count={count} ResultComponent={SearchResult} lang={lang} />
      </div>
    );
  }
}
