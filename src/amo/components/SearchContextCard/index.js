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
  ADDON_TYPE_THEME,
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
    const { query } = filters;
    const { addonType } = filters;

    let searchText;

    if (!loading && query && addonType) {
      if (addonType === ADDON_TYPE_EXTENSION) {
        searchText = i18n.sprintf(
          i18n.ngettext(
            '%(count)s extension found for "%(query)s"',
            '%(count)s extensions found for "%(query)s"',
            count,
          ),
          { count: i18n.formatNumber(count), query },
        );
      } else if (addonType === ADDON_TYPE_DICT) {
        searchText = i18n.sprintf(
          i18n.ngettext(
            '%(count)s dictionary found for "%(query)s"',
            '%(count)s dictionaries found for "%(query)s"',
            count,
          ),
          { count: i18n.formatNumber(count), query },
        );
      } else if (addonType === ADDON_TYPE_LANG) {
        searchText = i18n.sprintf(
          i18n.ngettext(
            '%(count)s language pack found for "%(query)s"',
            '%(count)s language packs found for "%(query)s"',
            count,
          ),
          { count: i18n.formatNumber(count), query },
        );
      } else if (addonType === ADDON_TYPE_THEME) {
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
            '%(count)s result found for "%(query)s"',
            '%(count)s results found for "%(query)s"',
            count,
          ),
          { count: i18n.formatNumber(count), query },
        );
      }
    } else if (!loading && query) {
      searchText = i18n.sprintf(
        i18n.ngettext(
          '%(count)s result for "%(query)s"',
          '%(count)s results for "%(query)s"',
          count,
        ),
        { count: i18n.formatNumber(count), query },
      );
    } else if (loading && query) {
      searchText = i18n.sprintf(i18n.gettext('Searching for "%(query)s"'), {
        query,
      });
    } else if (loading) {
      searchText = i18n.gettext('Loading add-ons');
    } else if (!loading && count === 0) {
      searchText = i18n.gettext('No add-ons found');
    } else {
      searchText = i18n.sprintf(
        i18n.ngettext(
          '%(count)s add-on found',
          '%(count)s add-ons found',
          count,
        ),
        { count: i18n.formatNumber(count) },
      );
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
