/* @flow */
import * as React from 'react';
import { Helmet } from 'react-helmet';

import Categories from 'amo/components/Categories';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import Page from 'amo/components/Page';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { apiAddonType } from 'core/utils';
import type { ReactRouterMatchType } from 'core/types/router';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| visibleAddonType: string |},
  |},
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class CategoriesPageBase extends React.Component<InternalProps> {
  getPageTitle(addonType: string) {
    const { i18n } = this.props;

    switch (addonType) {
      case ADDON_TYPE_EXTENSION:
        return i18n.gettext('All extension categories');
      case ADDON_TYPE_STATIC_THEME:
        return i18n.gettext('All theme categories');
      default:
        return null;
    }
  }

  render() {
    const { match } = this.props;
    const addonType = apiAddonType(match.params.visibleAddonType);

    const title = this.getPageTitle(addonType);

    return (
      <Page>
        <Helmet>
          <title>{title}</title>
        </Helmet>

        <HeadMetaTags title={title} />

        <HeadLinks />

        <Categories addonType={addonType} className="CategoriesPage" />
      </Page>
    );
  }
}

const CategoriesPage: React.ComponentType<Props> = translate()(
  CategoriesPageBase,
);

export default CategoriesPage;
