/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Search from 'amo/components/Search';
import Card from 'ui/components/Card';
import translate from 'core/i18n/translate';
import { convertQueryParamsToFilters } from 'core/searchUtils';

type PropTypes = {|
  filters: Object,
  i18n: Object,
|};

export class SearchPageBase extends React.Component {
  props: PropTypes;
  render() {
    const { filters, i18n } = this.props;
    if (!filters.query || filters.query.length === 0) {
      return (
        <div className="Search">
          <Card className="SearchContextCard">
            <h1 className="SearchContextCard-header">
              {i18n.gettext('Enter a search term and try again.')}
            </h1>
          </Card>
        </div>
      );
    }

    return <Search filters={filters} />;
  }
}

export function mapStateToProps(state: any, ownProps: any) {
  const { location } = ownProps;

  const filtersFromLocation = convertQueryParamsToFilters(location.query);

  // We don't allow `clientApp` or `lang` as a filter from location because
  // they can lead to weird, unintuitive URLs where the queryParams override
  // the `clientApp` and `lang` set elsewhere in the URL.
  // Removing them from the filters (essentially ignoring them) means URLs
  // like: `/en-US/firefox/search/?q=test&app=android&lang=fr` don't search
  // for French Android add-ons.
  // Maybe in the future this could redirect instead of ignoring bogus
  // `location.query` data.
  const filters = { ...filtersFromLocation };
  delete filters.clientApp;
  delete filters.lang;

  return { filters };
}

export default compose(
  translate(),
  connect(mapStateToProps),
)(SearchPageBase);
