import makeClassName from 'classnames';
import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import { LANDING_PAGE_EXTENSION_COUNT, LANDING_PAGE_THEME_COUNT } from 'amo/constants';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import type { AddonType } from 'amo/types/addons';
import './styles.scss';

type DefaultProps = {
  isHomepageShelf?: boolean;
  placeholderCount: number;
};
type Props = DefaultProps & {
  addonInstallSource?: string;
  addons?: Array<AddonType> | null;
  className?: string;
  footerLink?: Record<string, any> | string | null;
  footerText?: string;
  header?: React.ReactNode;
  isTheme?: boolean;
  loading?: boolean;
};
export default class LandingAddonsCard extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    isHomepageShelf: false,
    placeholderCount: LANDING_PAGE_EXTENSION_COUNT,
  };

  render(): React.ReactNode {
    const {
      addonInstallSource,
      addons,
      className,
      footerLink,
      footerText,
      header,
      isHomepageShelf,
      isTheme,
      loading,
      placeholderCount,
    } = this.props;
    let footerLinkHtml = null;
    const footerLinkProps = {};
    const count = isTheme ? LANDING_PAGE_THEME_COUNT : placeholderCount;

    if (addons && addons.length >= count) {
      if (footerLink && typeof footerLink === 'object') {
        // If an href has been passed, use that for the Link.
        if (footerLink.href) {
          footerLinkProps.href = footerLink.href;
          footerLinkProps.prependClientApp = false;
          footerLinkProps.prependLang = false;
          footerLinkProps.target = '_blank';
        } else {
          // As a convenience, fix the query parameter.
          footerLinkProps.to = { ...footerLink,
            query: convertFiltersToQueryParams(footerLink.query),
          };
        }
      } else {
        // It's just a string, so pass it into the `to` prop.
        footerLinkProps.to = footerLink;
      }

      footerLinkHtml = <Link {...footerLinkProps}>{footerText}</Link>;
    }

    return <AddonsCard
      addonInstallSource={addonInstallSource}
      addons={addons}
      className={makeClassName('LandingAddonsCard', className, {
      'LandingAddonsCard-Themes': isTheme,
    })}
      footerLink={footerLinkHtml}
      header={header}
      isHomepageShelf={isHomepageShelf}
      showPromotedBadge={false}
      type="horizontal"
      loading={loading}
      placeholderCount={count}
      useThemePlaceholder={isTheme}
    />;
  }

}