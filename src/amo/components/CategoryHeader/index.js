import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import CategoryIcon from 'amo/components/CategoryIcon';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { getCategoryColor } from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';


export class CategoryHeaderBase extends React.Component {
  static propTypes = {
    category: PropTypes.object,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { category, i18n } = this.props;

    const addonType = category && category.type ? category.type : null;

    let color = 0;
    let icon = null;

    if (category) {
      color = getCategoryColor(category);
      icon = category.slug === 'other' ? `other-${addonType}` : category.slug;
    }

    // This is here until
    // https://github.com/mozilla/addons-server/issues/5728
    // as well as
    // https://github.com/mozilla/addons-server/issues/5729 are fixed.
    // Also, if we don't get a description for a category (maybe it's a new one
    // or lacks a description) we'll show this generic message.
    if (category && !category.description) {
      category.description = i18n.gettext(
        'Browse all add-ons in this category.');

      if (category.type === ADDON_TYPE_EXTENSION) {
        category.description = i18n.gettext(
          'Browse all extensions in this category.');
      }

      if (category.type === ADDON_TYPE_THEME) {
        category.description = i18n.gettext(
          'Browse all themes in this category.');
      }
    }

    return (
      <Card
        className={makeClassName('CategoryHeader', {
          'CategoryHeader--loading': !category,
          [`CategoryHeader--type-${addonType}`]: addonType,
        })}
      >
        <div className="CategoryHeader-wrapper">
          <div className="CategoryHeader-contents">
            <h1 className="CategoryHeader-name">
              {category ? category.name : <LoadingText />}
            </h1>
            <div className="CategoryHeader-description">
              {category ? (
                <p className="CategoryHeader-paragraph">
                  {category.description}
                </p>
              ) : (
                <p className="CategoryHeader-paragraph">
                  <LoadingText />
                  <br />
                  <LoadingText />
                </p>
              )}
            </div>
          </div>
          {icon && (
            <div className="CategoryHeader-icon">
              <CategoryIcon name={icon} color={color} />
            </div>
          )}
        </div>
      </Card>
    );
  }
}

export default compose(
  translate(),
)(CategoryHeaderBase);
