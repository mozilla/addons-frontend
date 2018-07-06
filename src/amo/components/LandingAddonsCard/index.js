/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import {
  LANDING_PAGE_ADDON_COUNT,
  LANDING_PAGE_THEME_ADDON_COUNT,
} from 'amo/constants';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import type { AddonType } from 'core/types/addons';
import { isTheme } from 'core/utils';

type Props = {|
  addonInstallSource?: string,
  addons?: Array<AddonType> | null,
  className?: string,
  footerLink?: Object | string | null,
  footerText?: string,
  header?: React.Node,
  loading: boolean,
|};

export default class LandingAddonsCard extends React.Component<Props> {
  render() {
    const {
      addonInstallSource,
      addons,
      className,
      footerLink,
      footerText,
      header,
      loading,
    } = this.props;

    const filterType = footerLink.query ? footerLink.query.addonType : null;
    const addonTypeArray = filterType ? filterType.split(',') : [];
    const placeholderCount = addonTypeArray.find((type) => isTheme(type))
      ? LANDING_PAGE_THEME_ADDON_COUNT
      : LANDING_PAGE_ADDON_COUNT;

    let footerLinkHtml = null;
    if (addons && addons.length >= placeholderCount) {
      let linkTo = footerLink;
      if (linkTo && typeof linkTo === 'object') {
        // As a convenience, fix the query parameter.
        linkTo = {
          ...linkTo,
          query: convertFiltersToQueryParams(linkTo.query),
        };
      }
      footerLinkHtml = <Link to={linkTo}>{footerText}</Link>;
    }

    return (
      <AddonsCard
        addonInstallSource={addonInstallSource}
        addons={addons}
        className={makeClassName('LandingAddonsCard', className)}
        footerLink={footerLinkHtml}
        header={header}
        type="horizontal"
        loading={loading}
        placeholderCount={placeholderCount}
      />
    );
  }
}
