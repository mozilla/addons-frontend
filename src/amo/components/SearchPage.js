import React, { PropTypes } from 'react';

import Link from 'amo/components/Link';
import Paginate from 'core/components/Paginate';
import SearchResults from 'core/components/Search/SearchResults';

import CategoryInfo from './CategoryInfo';
import SearchResult from './SearchResult';


export default class SearchPage extends React.Component {
  static propTypes = {
    CategoryInfoComponent: PropTypes.node.isRequired,
    LinkComponent: PropTypes.node.isRequired,
    ResultComponent: PropTypes.node.isRequired,
    addonType: PropTypes.string.isRequired,
    category: PropTypes.string,
    count: PropTypes.number,
    hasSearchParams: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired,
    page: PropTypes.number,
    results: PropTypes.array,
    query: PropTypes.string,
  }

  static defaultProps = {
    CategoryInfoComponent: CategoryInfo,
    LinkComponent: Link,
    ResultComponent: SearchResult,
  }

  render() {
    const { CategoryInfoComponent, LinkComponent, ResultComponent,
      addonType, category, count, hasSearchParams, loading, page, query,
      results,
    } = this.props;
    const paginator = query && count > 0 ?
      <Paginate LinkComponent={LinkComponent} count={count} currentPage={page}
        pathname="/search/" query={{ q: query }} showPages={0} /> : [];

    return (
      <div className="search-page">
        <SearchResults CategoryInfoComponent={CategoryInfoComponent}
          ResultComponent={ResultComponent} addonType={addonType}
          category={category} count={count} hasSearchParams={hasSearchParams}
          loading={loading} query={query} results={results} />
        {paginator}
      </div>
    );
  }
}
