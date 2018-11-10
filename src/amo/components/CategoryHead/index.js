/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import Helmet from 'react-helmet';

import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import type { CategoryType } from 'amo/types/categories';
import type { I18nType } from 'core/types/i18n';

type Props = {|
  category: CategoryType | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class CategoryHeadBase extends React.PureComponent<InternalProps> {
  getPageTitle() {
    const { category, i18n } = this.props;

    invariant(category, 'category is required');

    let title;
    switch (category.type) {
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
    const { category } = this.props;

    if (!category) {
      return null;
    }

    const title = this.getPageTitle();

    return (
      <React.Fragment>
        <Helmet>
          <title>{title}</title>
        </Helmet>

        <HeadMetaTags description={category.description} title={title} />

        <HeadLinks />
      </React.Fragment>
    );
  }
}

const CategoryHead: React.ComponentType<Props> = translate()(CategoryHeadBase);

export default CategoryHead;
