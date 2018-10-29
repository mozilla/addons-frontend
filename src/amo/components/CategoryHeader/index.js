/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import CategoryIcon from 'amo/components/CategoryIcon';
import { getCategoryColor } from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import type { CategoryType } from 'amo/types/categories';

import './styles.scss';

type Props = {|
  category: CategoryType | null,
|};

export class CategoryHeaderBase extends React.PureComponent<Props> {
  render() {
    const { category } = this.props;

    const addonType = category && category.type ? category.type : null;

    let icon = null;
    if (category && addonType) {
      icon = category.slug === 'other' ? `other-${addonType}` : category.slug;
    }

    return (
      <Card
        className={makeClassName('CategoryHeader', {
          'CategoryHeader--loading': !category,
        })}
      >
        <div className="CategoryHeader-wrapper">
          {icon && (
            <CategoryIcon
              className="CategoryHeader-icon"
              color={getCategoryColor(category)}
              name={icon}
            />
          )}

          <h1 className="CategoryHeader-name">
            {category ? category.name : <LoadingText />}
          </h1>
        </div>
      </Card>
    );
  }
}

export default CategoryHeaderBase;
