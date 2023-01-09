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
import type { AddonType, CollectionAddonType } from 'amo/types/addons';

import './styles.scss';

type DefaultProps = {|
  alwaysDisplayFooter?: boolean,
  isHomepageShelf?: boolean,
  placeholderCount: number,
|};

type Props = {|
  ...DefaultProps,
  addonInstallSource?: string,
  addons?: Array<AddonType> | Array<CollectionAddonType> | null,
  className?: string,
  footerLink?: Object | string | null,
  footerText?: string,
  header?: React.Node,
  isTheme?: boolean,
  loading?: boolean,
  onAddonClick?: (addon: AddonType | CollectionAddonType) => void,
|};

export default class LandingAddonsCard extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    alwaysDisplayFooter: false,
    isHomepageShelf: false,
    placeholderCount: LANDING_PAGE_EXTENSION_COUNT,
  };

  render(): React.Node {
    const {
      addonInstallSource,
      addons,
      alwaysDisplayFooter,
      className,
      footerLink,
      footerText,
      header,
      isHomepageShelf,
      isTheme,
      loading,
      onAddonClick,
      placeholderCount,
    } = this.props;

    let footerLinkHtml = null;
    const footerLinkProps = {};
    const count = isTheme ? LANDING_PAGE_THEME_COUNT : placeholderCount;

    if (addons && (addons.length >= count || alwaysDisplayFooter)) {
      if (footerLink && typeof footerLink === 'object') {
        // If an href has been passed, use that for the Link.
        if (footerLink.href) {
          footerLinkProps.href = footerLink.href;
          footerLinkProps.prependClientApp = false;
          footerLinkProps.prependLang = false;
          footerLinkProps.target = '_blank';
        } else {
          // As a convenience, fix the query parameter.
          footerLinkProps.to = {
            ...footerLink,
            query: convertFiltersToQueryParams(footerLink.query),
          };
        }
      } else {
        // It's just a string, so pass it into the `to` prop.
        footerLinkProps.to = footerLink;
      }

      footerLinkHtml = <Link {...footerLinkProps}>{footerText}</Link>;
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
        isHomepageShelf={isHomepageShelf}
        onAddonClick={onAddonClick}
        showPromotedBadge={false}
        type="horizontal"
        loading={loading}
        placeholderCount={count}
        useThemePlaceholder={isTheme}
      />
    );
  }
}
