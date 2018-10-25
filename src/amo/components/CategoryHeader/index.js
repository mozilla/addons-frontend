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
    let className = null;

    if (category && addonType) {
      icon = category.slug === 'other' ? `other-${addonType}` : category.slug;
      className = `CategoryHeader--type-${addonType}`;
    }

    return (
      <Card
        className={makeClassName('CategoryHeader', className, {
          'CategoryHeader--loading': !category,
        })}
      >
        <div className="CategoryHeader-wrapper">
          {icon && (
            <div className="CategoryHeader-icon">
              <CategoryIcon name={icon} color={getCategoryColor(category)} />
            </div>
          )}

          <div className="CategoryHeader-contents">
            <h1 className="CategoryHeader-name">
              {category ? category.name : <LoadingText />}
            </h1>
          </div>
        </div>
      </Card>
    );
  }
}

export default CategoryHeaderBase;
