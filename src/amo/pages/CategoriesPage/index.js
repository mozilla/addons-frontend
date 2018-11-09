/* @flow */
import config from 'config';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Categories from 'amo/components/Categories';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import NotFound from 'amo/components/ErrorPage/NotFound';
import { shouldShowThemes } from 'amo/utils';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { apiAddonType, isTheme } from 'core/utils';
import type { AppState } from 'amo/store';
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
  _config: typeof config,
  clientApp: string,
  i18n: I18nType,
|};

export class CategoriesPageBase extends React.Component<InternalProps> {
  static defaultProps = {
    _config: config,
  };

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
    const { _config, clientApp, match } = this.props;
    const addonType = apiAddonType(match.params.visibleAddonType);

    if (isTheme(addonType) && !shouldShowThemes({ _config, clientApp })) {
      return <NotFound />;
    }

    const title = this.getPageTitle(addonType);

    return (
      <React.Fragment>
        <Helmet>
          <title>{title}</title>
        </Helmet>

        <HeadMetaTags title={title} />

        <HeadLinks />

        <Categories addonType={addonType} className="CategoriesPage" />
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
  };
};

const CategoriesPage: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(CategoriesPageBase);

export default CategoriesPage;
