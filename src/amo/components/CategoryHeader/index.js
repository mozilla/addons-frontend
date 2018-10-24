import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';

import CategoryIcon from 'amo/components/CategoryIcon';
import { getCategoryColor } from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';

export class CategoryHeaderBase extends React.Component {
  static propTypes = {
    category: PropTypes.object,
  };

  render() {
    const { category } = this.props;

    const addonType = category && category.type ? category.type : null;

    let color = 0;
    let icon = null;

    if (category) {
      color = getCategoryColor(category);
      icon = category.slug === 'other' ? `other-${addonType}` : category.slug;
    }

    return (
      <Card
        className={makeClassName('CategoryHeader', {
          'CategoryHeader--loading': !category,
          [`CategoryHeader--type-${addonType}`]: addonType,
        })}
      >
        <div className="CategoryHeader-wrapper">
          {icon && (
            <div className="CategoryHeader-icon">
              <CategoryIcon name={icon} color={color} />
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
