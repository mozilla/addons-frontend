/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import Categories from 'amo/components/Categories';
import { apiAddonType } from 'core/utils';
import translate from 'core/i18n/translate';

import './styles.scss';

type Props = {|
  params: {| visibleAddonType: string |},
|};

export class CategoriesPageBase extends React.Component<Props> {
  render() {
    const addonType = apiAddonType(this.props.params.visibleAddonType);
    return <Categories addonType={addonType} className="CategoriesPage" />;
  }
}

export default compose(
  translate({ withRef: true }),
)(CategoriesPageBase);
