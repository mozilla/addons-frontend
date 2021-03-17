/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import {
  LANDING_PAGE_EXTENSION_COUNT,
  LANDING_PAGE_THEME_COUNT,
} from 'amo/constants';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import type { AddonType } from 'amo/types/addons';

import './styles.scss';

type DefaultProps = {|
  placeholderCount: number,
|};

type Props = {|
  ...DefaultProps,
  addonInstallSource?: string,
  addons?: Array<AddonType> | null,
  className?: string,
  footerLink?: Object | string | null,
  footerText?: string,
  header?: React.Node,
  isTheme?: boolean,
  loading?: boolean,
|};

export default class LandingAddonsCard extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    placeholderCount: LANDING_PAGE_EXTENSION_COUNT,
  };

  render(): React.Node {
    const {
      addonInstallSource,
      addons,
      className,
      footerLink,
      footerText,
      header,
      isTheme,
      loading,
      placeholderCount,
    } = this.props;

    let footerLinkHtml = null;
    const count = isTheme ? LANDING_PAGE_THEME_COUNT : placeholderCount;
    if (addons && addons.length >= count) {
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
        className={makeClassName('LandingAddonsCard', className, {
          'LandingAddonsCard-Themes': isTheme,
        })}
        footerLink={footerLinkHtml}
        header={header}
        showPromotedBadge={false}
        type="horizontal"
        loading={loading}
        placeholderCount={count}
        useThemePlaceholder={isTheme}
      />
    );
  }
}
