/* @flow */
import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getCanonicalURL } from 'amo/utils';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';

type CategoryType = {|
  application: string,
  description: string,
  id: number,
  misc: boolean,
  name: string,
  slug: string,
  type:
    | 'extension'
    | 'theme'
    | 'dictionary'
    | 'search'
    | 'language'
    | 'persona',
  weight: number,
|};

type Props = {|
  category: CategoryType | null,
  type: 'extension' | 'theme' | null,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  i18n: I18nType,
  locationPathname: string,
|};

export class CategoryHeadBase extends React.PureComponent<InternalProps> {
  getPageTitle() {
    const { category, i18n, type } = this.props;

    invariant(category, 'category is required');

    let title;
    switch (type) {
      case ADDON_TYPE_EXTENSION:
        title = i18n.gettext('%(categoryName)s – Extensions');
        break;
      case ADDON_TYPE_THEME:
        title = i18n.gettext('%(categoryName)s – Themes');
        break;
      default:
        // translators: Only the "categoryName" variable is supplied here.
        title = i18n.gettext('%(categoryName)s');
        break;
    }

    return i18n.sprintf(title, { categoryName: category.name });
  }

  render() {
    const { _config, category, locationPathname } = this.props;

    if (!category) {
      return null;
    }

    return (
      <Helmet>
        <title>{this.getPageTitle()}</title>
        <link
          rel="canonical"
          href={getCanonicalURL({ locationPathname, _config })}
        />
      </Helmet>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const locationPathname = state.router.location.pathname;

  return {
    locationPathname,
  };
};

const CategoryHead: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(CategoryHeadBase);

export default CategoryHead;
