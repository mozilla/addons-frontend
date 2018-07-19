/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import Categories from 'amo/components/Categories';
import { apiAddonType } from 'core/utils';
import translate from 'core/i18n/translate';
import type { ReactRouterMatchType } from 'core/types/router';

import './styles.scss';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| visibleAddonType: string |},
  |},
|};

export class CategoriesPageBase extends React.Component<Props> {
  render() {
    const { match } = this.props;
    const addonType = apiAddonType(match.params.visibleAddonType);

    return <Categories addonType={addonType} className="CategoriesPage" />;
  }
}

const CategoriesPage: React.ComponentType<Props> = compose(translate())(
  CategoriesPageBase,
);

export default CategoriesPage;
