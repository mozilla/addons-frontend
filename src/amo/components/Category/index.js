import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import CategoryHeader from 'amo/components/CategoryHeader';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Search from 'amo/components/Search';
import { categoriesFetch } from 'core/actions/categories';
import { withErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import { apiAddonType, parsePage } from 'core/utils';

import './styles.scss';


export class CategoryBase extends React.Component {
  static propTypes = {
    categories: PropTypes.object,
    clientApp: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    loading: PropTypes.bool,
    location: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
  }

  componentWillMount() {
    const { categories, dispatch, errorHandler, loading } = this.props;

    if (!loading && !categories) {
      dispatch(categoriesFetch({ errorHandlerId: errorHandler.id }));
    }
  }

  render() {
    const {
      categories,
      clientApp,
      errorHandler,
      loading,
      location,
      params,
    } = this.props;

    let addonType;
    try {
      addonType = apiAddonType(params.visibleAddonType);
    } catch (error) {
      log.info(
        `addonType ${params.visibleAddonType} threw an error: ${error}`);
      return <NotFound />;
    }
    const categorySlug = params.slug;
    const filters = {
      addonType,
      category: categorySlug,
      page: parsePage(location.query.page),
    };
    const pathname = `/${params.visibleAddonType}/${categorySlug}/`;
    const paginationQueryParams = { page: filters.page };

    let category;
    if (categories) {
      if (categories[clientApp] && categories[clientApp][addonType]) {
        category = categories[clientApp][addonType][categorySlug];
      }

      if (!errorHandler.hasError() && !loading && !category) {
        return <NotFound />;
      }
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

export function mapStateToProps(state) {
  return {
    categories: state.categories.categories,
    clientApp: state.api.clientApp,
    loading: state.categories.loading,
  };
}

export default compose(
  withErrorHandler({ name: 'Category' }),
  connect(mapStateToProps),
)(CategoryBase);
