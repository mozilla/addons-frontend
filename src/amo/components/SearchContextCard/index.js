import PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { categoriesFetch } from 'core/actions/categories';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEMES_FILTER } from 'core/constants';

import './styles.scss';

export class SearchContextCardBase extends React.Component {
  static propTypes = {
    categoryName: PropTypes.string,
    count: PropTypes.number,
    filters: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    count: 0,
    filters: {},
  };

  render() {
    const { categoryName, count, filters, i18n, loading } = this.props;
    const { addonType, query, category } = filters;

    let searchText;

    if (!loading) {
      switch (addonType) {
        case ADDON_TYPE_EXTENSION:
          if (category && categoryName) {
            if (query) {
              searchText = i18n.sprintf(
                i18n.ngettext(
                  '%(count)s extension found for "%(query)s" in %(categoryName)s',
                  '%(count)s extensions found for "%(query)s" in %(categoryName)s',
                  count,
                ),
                { count: i18n.formatNumber(count), query, categoryName },
              );
            } else {
              searchText = i18n.sprintf(
                i18n.ngettext(
                  '%(count)s extension found in %(categoryName)s',
                  '%(count)s extensions found in %(categoryName)s',
                  count,
                ),
                { count: i18n.formatNumber(count), categoryName },
              );
            }
          } else if (query) {
            searchText = i18n.sprintf(
              i18n.ngettext(
                '%(count)s extension found for "%(query)s"',
                '%(count)s extensions found for "%(query)s"',
                count,
              ),
              { count: i18n.formatNumber(count), query },
            );
          } else {
            searchText = i18n.sprintf(
              i18n.ngettext(
                '%(count)s extension found',
                '%(count)s extensions found',
                count,
              ),
              { count: i18n.formatNumber(count) },
            );
          }
          break;
        case ADDON_TYPE_THEMES_FILTER:
          if (category && categoryName) {
            if (query) {
              searchText = i18n.sprintf(
                i18n.ngettext(
                  '%(count)s theme found for "%(query)s" in %(categoryName)s',
                  '%(count)s themes found for "%(query)s" in %(categoryName)s',
                  count,
                ),
                { count: i18n.formatNumber(count), query, categoryName },
              );
            } else {
              searchText = i18n.sprintf(
                i18n.ngettext(
                  '%(count)s theme found in %(categoryName)s',
                  '%(count)s themes found in %(categoryName)s',
                  count,
                ),
                { count: i18n.formatNumber(count), categoryName },
              );
            }
          } else if (query) {
            searchText = i18n.sprintf(
              i18n.ngettext(
                '%(count)s theme found for "%(query)s"',
                '%(count)s themes found for "%(query)s"',
                count,
              ),
              { count: i18n.formatNumber(count), query },
            );
          } else {
            searchText = i18n.sprintf(
              i18n.ngettext(
                '%(count)s theme found',
                '%(count)s themes found',
                count,
              ),
              { count: i18n.formatNumber(count) },
            );
          }
          break;
        default:
          if (query) {
            searchText = i18n.sprintf(
              i18n.ngettext(
                '%(count)s result found for "%(query)s"',
                '%(count)s results found for "%(query)s"',
                count,
              ),
              { count: i18n.formatNumber(count), query },
            );
          } else {
            searchText = i18n.sprintf(
              i18n.ngettext(
                '%(count)s result found',
                '%(count)s results found',
                count,
              ),
              { count: i18n.formatNumber(count) },
            );
          }
          break;
      }
    } else if (loading && query) {
      searchText = i18n.sprintf(i18n.gettext('Searching for "%(query)s"'), {
        query,
      });
    } else if (loading) {
      searchText = i18n.gettext('Loading add-ons');
    } else if (!loading && count === 0) {
      searchText = i18n.gettext('No add-ons found');
    }

    return (
      <Card className="SearchContextCard">
        <h1 className="SearchContextCard-header">{searchText}</h1>
      </Card>
    );
  }
}

export function mapStateToProps(state) {
  return {
    categoriesState: state.categories.categories,
    clientApp: state.api.clientApp,
    count: state.search.count,
    filters: state.search.filters,
    loading: state.search.loading,
  };
}

export function mapDispatchToProps(dispatch) {
  dispatch(categoriesFetch({ errorHandlerId: 'SearchContextCard' }));
}

function mergeProps(state, dispatchProps, ownProps) {
  const {
    categoriesState,
    clientApp,
    filters: { category: currentCategory },
  } = state;

  const allCategories = [];

  if (categoriesState && clientApp) {
    Object.keys(categoriesState[clientApp]).forEach((type) => {
      Object.keys(categoriesState[clientApp][type]).forEach((category) => {
        const { slug } = categoriesState[clientApp][type][category];
        const { name } = categoriesState[clientApp][type][category];
        allCategories.push({
          [slug]: {
            name,
            slug,
          },
        });
      });
    });
  }

  const translatedCategory =
    currentCategory &&
    allCategories.length &&
    allCategories.find(
      (category) =>
        category[currentCategory] &&
        category[currentCategory].slug === currentCategory,
    );

  return {
    categoryName:
      translatedCategory &&
      currentCategory &&
      translatedCategory[currentCategory] &&
      translatedCategory[currentCategory].name,
    ...state,
    ...ownProps,
  };
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
  ),
  translate(),
)(SearchContextCardBase);
