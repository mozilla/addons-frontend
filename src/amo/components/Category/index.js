import deepEqual from 'deep-eql';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import CategoryHeader from 'amo/components/CategoryHeader';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { SearchBase } from 'amo/components/Search';
import { categoriesFetch } from 'core/actions/categories';
import { withErrorHandler } from 'core/errorHandler';
import { loadByCategoryIfNeeded, parsePage } from 'core/searchUtils';
import {
  apiAddonType,
  getCategoryFromState,
  safeAsyncConnect,
} from 'core/utils';

import './styles.scss';


export class CategoryBase extends React.Component {
  static propTypes = {
    category: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    loading: PropTypes.boolean,
  }

  componentWillMount() {
    const { category, dispatch, errorHandler } = this.props;

    if (!category) {
      dispatch(categoriesFetch({ errorHandlerId: errorHandler.id }));
    }
  }

  render() {
    const { category, errorHandler, loading, ...searchProps } = this.props;

    if (!errorHandler.hasError() && loading === false && !category) {
      return <NotFound />;
    }

    return (
      <div className="Category">
        {errorHandler.hasError() ? errorHandler.renderError() : null}
        <CategoryHeader category={category} />
        <SearchBase enableSearchSort={false} hasSearchParams {...searchProps} />
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  const filters = {
    addonType: apiAddonType(ownProps.params.visibleAddonType),
    category: ownProps.params.slug,
    clientApp: ownProps.params.application,
  };
  const pathname = `/${ownProps.params.visibleAddonType}/${filters.category}/`;
  const queryParams = { page: parsePage(ownProps.location.query.page) };

  const category = getCategoryFromState({
    addonType: filters.addonType,
    categorySlug: filters.category,
    clientApp: filters.clientApp,
    state,
  });

  const filtersMatchState = deepEqual(
    { ...state.search.filters, page: parsePage(state.search.page) },
    { ...filters, page: queryParams.page },
  );
  if (filtersMatchState) {
    return {
      addonType: filters.addonType,
      category,
      filters,
      pathname,
      queryParams,
      ...state.search,
    };
  }

  return {
    addonType: filters.addonType,
    category,
    pathname,
    queryParams,
  };
}

export default compose(
  withErrorHandler({ name: 'Category' }),
  safeAsyncConnect([{ promise: loadByCategoryIfNeeded }]),
  connect(mapStateToProps),
)(CategoryBase);
