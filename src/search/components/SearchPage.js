import React, { PropTypes } from 'react';

import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import { gettext as _ } from 'core/utils';

import 'search/css/SearchPage.scss';


export default class SearchPage extends React.Component {
  static propTypes = {
    handleSearch: PropTypes.func.isRequired,
    results: PropTypes.arrayOf(PropTypes.shape({
      slug: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    })),
    query: PropTypes.string,
  }

  render() {
    const { handleSearch, results, query } = this.props;

    return (
      <div className="search-page">
        <h1>{_('Add-on Search')}</h1>
        <SearchForm onSearch={handleSearch} />
        <SearchResults results={results} query={query} />
      </div>
    );
  }
}
