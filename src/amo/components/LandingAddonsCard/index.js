import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import { LANDING_PAGE_ADDON_COUNT } from 'amo/constants';
import { convertFiltersToQueryParams } from 'core/searchUtils';

export default class LandingAddonsCard extends React.Component {
  static propTypes = {
    addons: PropTypes.array.isRequired,
    className: PropTypes.string,
    footerLink: PropTypes.object.isRequired,
    footerText: PropTypes.string.isRequired,
    header: PropTypes.node.isRequired,
    loading: PropTypes.bool.isRequired,
    placeholderCount: PropTypes.number.isRequired,
  }

  static defaultProps = {
    placeholderCount: LANDING_PAGE_ADDON_COUNT,
  }

  render() {
    const {
      addons,
      className,
      footerLink,
      footerText,
      header,
      loading,
      placeholderCount,
    } = this.props;

    const linkSearchURL = {
      ...footerLink,
      query: convertFiltersToQueryParams(footerLink.query),
    };
    const footerLinkHtml = <Link to={linkSearchURL}>{footerText}</Link>;

    return (
      <AddonsCard
        addons={addons}
        className={classNames('LandingAddonsCard', className)}
        footerLink={footerLinkHtml}
        header={header}
        type="horizontal"
        loading={loading}
        placeholderCount={placeholderCount}
      />
    );
  }
}
