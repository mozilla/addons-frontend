import PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  ADDON_TYPE_THEMES_FILTER,
} from 'core/constants';

import './styles.scss';

export class SearchContextCardBase extends React.Component {
  static propTypes = {
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
    const { count, filters, i18n, loading } = this.props;
    const { query, category } = filters;
    const { addonType } = filters;

    let searchText;

    if (!loading) {
      switch (addonType) {
        case ADDON_TYPE_EXTENSION:
          if (category) {
            const categoryName = category.replace('-', ' ');

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
        case ADDON_TYPE_DICT:
          if (category) {
            const categoryName = category.replace('-', ' ');

            if (query) {
              searchText = i18n.sprintf(
                i18n.ngettext(
                  '%(count)s result found for "%(query)s" in %(categoryName)s',
                  '%(count)s results found for "%(query)s" in %(categoryName)s',
                  count,
                ),
                { count: i18n.formatNumber(count), query, categoryName },
              );
            } else {
              searchText = i18n.sprintf(
                i18n.ngettext(
                  '%(count)s result found in %(categoryName)s',
                  '%(count)s results found in %(categoryName)s',
                  count,
                ),
                { count: i18n.formatNumber(count), categoryName },
              );
            }
          } else if (query) {
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
        case ADDON_TYPE_LANG:
          if (category) {
            const categoryName = category.replace('-', ' ');

            if (query) {
              searchText = i18n.sprintf(
                i18n.ngettext(
                  '%(count)s result found for "%(query)s" in %(categoryName)s',
                  '%(count)s results found for "%(query)s" in %(categoryName)s',
                  count,
                ),
                { count: i18n.formatNumber(count), query, categoryName },
              );
            } else {
              searchText = i18n.sprintf(
                i18n.ngettext(
                  '%(count)s result found in %(categoryName)s',
                  '%(count)s results found in %(categoryName)s',
                  count,
                ),
                { count: i18n.formatNumber(count), categoryName },
              );
            }
          } else if (query) {
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
        case ADDON_TYPE_THEMES_FILTER:
          if (category) {
            const categoryName = category.replace('-', ' ');

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
          searchText = i18n.sprintf(
            i18n.ngettext(
              '%(count)s result found for "%(query)s"',
              '%(count)s results found for "%(query)s"',
              count,
            ),
            { count: i18n.formatNumber(count), query },
          );
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
    count: state.search.count,
    filters: state.search.filters,
    loading: state.search.loading,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(SearchContextCardBase);
