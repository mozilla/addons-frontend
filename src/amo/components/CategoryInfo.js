import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { loadCategoriesIfNeeded } from 'core/utils';

import './CategoryInfo.scss';


export class CategoryInfoBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    categories: PropTypes.arrayOf(PropTypes.object),
    clientApp: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
  }

  render() {
    const { addonType, categories, clientApp, slug } = this.props;

    if (!categories) {
      return null;
    }

    const categoryMatch = categories.filter((category) => (
      category.application === clientApp && category.slug === slug &&
        category.type === addonType
    ));
    const category = categoryMatch.length ? categoryMatch[0] : false;

    if (!category) {
      return null;
    }

    return (
      <div className={classNames('CategoryInfo', category.slug)}>
        <h2 className="CategoryInfo-header"
          ref={(ref) => { this.header = ref; }}>
          {category.name}
        </h2>
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    clientApp: state.api.clientApp,
    ...state.categories,
  };
}

export default compose(
  asyncConnect([{
    deferred: true,
    key: 'CategoryInfo',
    promise: loadCategoriesIfNeeded,
  }]),
  connect(mapStateToProps),
  translate({ withRef: true }),
)(CategoryInfoBase);
