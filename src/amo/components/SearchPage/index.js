import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Search from 'amo/components/Search';
import Card from 'ui/components/Card';
import translate from 'core/i18n/translate';
import { convertQueryParamsToFilters } from 'core/searchUtils';

export class SearchPageBase extends React.Component {
  static propTypes = {
    filters: PropTypes.object,
    i18n: PropTypes.object.isRequired,
  };

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

export function mapStateToProps(state, ownProps) {
  const { location } = ownProps;

  const filters = convertQueryParamsToFilters(location.query);
  return { filters: { ...filters, clientApp: state.api.clientApp } };
}

export default compose(
  translate(),
  connect(mapStateToProps),
)(SearchPageBase);
