/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import {
  convertFiltersToQueryParams,
  convertOSToFilterValue,
} from 'core/searchUtils';
import type { UserAgentInfoType } from 'core/reducers/api';


// This isn't strict because there are other types for Link component.
type PropTypes = {
  filters: Object,
  setOperatingSystem: boolean,
  userAgentInfo: UserAgentInfoType,
}

export class SearchLinkBase extends React.Component {
  static defaultProps = {
    setOperatingSystem: true,
  }

  props: PropTypes;

  render() {
    const {
      filters,
      setOperatingSystem,
      userAgentInfo,
      ...linkProps
    } = this.props;

    const newFilters = { ...filters };
    if (setOperatingSystem) {
      newFilters.operatingSystem = convertOSToFilterValue(
        userAgentInfo.os.name);
    }

    const query = convertFiltersToQueryParams(newFilters);

    return <Link {...linkProps} to={{ pathname: '/search/', query }} />;
  }
}

const mapStateToProps = (state) => {
  return { userAgentInfo: state.api.userAgentInfo };
};

export default compose(
  connect(mapStateToProps),
)(SearchLinkBase);
