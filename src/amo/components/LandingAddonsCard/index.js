import classNames from 'classnames';
import React, { PropTypes } from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import { convertFiltersToQueryParams } from 'core/searchUtils';


export default class LandingAddonsCard extends React.Component {
  static propTypes = {
    addons: PropTypes.array.isRequired,
    className: PropTypes.string,
    footerLink: PropTypes.object.isRequired,
    footerText: PropTypes.string.isRequired,
    header: PropTypes.node.isRequired,
  }

  render() {
    const { addons, className, footerLink, footerText, header } = this.props;
    const linkSearchURL = {
      ...footerLink,
      query: convertFiltersToQueryParams(footerLink.query),
    };
    const footerLinkHtml = <Link to={linkSearchURL}>{footerText}</Link>;

    return (
      <AddonsCard className={classNames('LandingAddonsCard', className)}
        addons={addons} footerLink={footerLinkHtml} header={header} />
    );
  }
}
