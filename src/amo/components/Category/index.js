import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import CategoryHeader from 'amo/components/CategoryHeader';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Search from 'amo/components/Search';
import { categoriesFetch } from 'core/actions/categories';
import { withErrorHandler } from 'core/errorHandler';
import { apiAddonType, getCategoryFromState, parsePage } from 'core/utils';

import './styles.scss';


export class CategoryBase extends React.Component {
  static propTypes = {
    category: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    filters: PropTypes.object,
    loading: PropTypes.bool,
    paginationQueryParams: PropTypes.object,
    pathname: PropTypes.string,
  }

  componentWillMount() {
    const { category, dispatch, errorHandler } = this.props;

    if (!category) {
      dispatch(categoriesFetch({ errorHandlerId: errorHandler.id }));
    }
  }

  render() {
    const {
      category,
      errorHandler,
      filters,
      loading,
      paginationQueryParams,
      pathname,
    } = this.props;

    if (!errorHandler.hasError() && loading === false && !category) {
      return <NotFound />;
    }

    return (
      <div className="Category">
        {errorHandler.renderErrorIfPresent()}
        <CategoryHeader category={category} />
        <Search
          enableSearchSort={false}
          filters={filters}
          paginationQueryParams={paginationQueryParams}
          pathname={pathname}
        />
      </div>
    );
  }
}

export function mapStateToProps(state, ownProps) {
  const filters = {
    addonType: apiAddonType(ownProps.params.visibleAddonType),
    category: ownProps.params.slug,
    page: parsePage(ownProps.location.query.page),
  };
  const pathname = `/${ownProps.params.visibleAddonType}/${filters.category}/`;
  const paginationQueryParams = { page: filters.page };

  const category = getCategoryFromState({
    addonType: filters.addonType,
    categorySlug: filters.category,
    clientApp: state.api.clientApp,
    state,
  });

  const loading = state.categories.loading || state.search.loading;

  return {
    addonType: filters.addonType,
    category,
    filters,
    loading,
    pathname,
    paginationQueryParams,
  };
}

export default compose(
  withErrorHandler({ name: 'Category' }),
  connect(mapStateToProps),
)(CategoryBase);
