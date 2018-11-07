/* @flow */
import * as React from 'react';
import Helmet from 'react-helmet';

import Categories from 'amo/components/Categories';
import HeadLinks from 'amo/components/HeadLinks';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import { apiAddonType } from 'core/utils';
import translate from 'core/i18n/translate';
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
      case ADDON_TYPE_THEME:
        return i18n.gettext('All theme categories');
      default:
        return null;
    }
  }

  render() {
    const { match } = this.props;
    const addonType = apiAddonType(match.params.visibleAddonType);

    return (
      <React.Fragment>
        <Helmet>
          <title>{this.getPageTitle(addonType)}</title>
        </Helmet>

        <HeadLinks />

        <Categories addonType={addonType} className="CategoriesPage" />
      </React.Fragment>
    );
  }
}

const CategoriesPage: React.ComponentType<Props> = translate()(
  CategoriesPageBase,
);

export default CategoriesPage;
