import React, { PropTypes } from 'react';

import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import { gettext as _ } from 'core/utils';

const SearchPage = ({ handleSearch, results, query }) => (
  <div className="search-page">
    <h1>{_('Add-on Search')}</h1>
    <SearchForm onSearch={handleSearch} />
    <SearchResults results={results} query={query} />
  </div>
);

SearchPage.propTypes = {
  handleSearch: PropTypes.func.isRequired,
  results: PropTypes.arrayOf(PropTypes.shape({
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  })),
  query: PropTypes.string,
};

export default SearchPage;
