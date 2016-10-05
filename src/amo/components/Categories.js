import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import './Categories.scss';


export function filterAndSortCategories(categories, addonType, clientApp) {
  return categories.filter((category) => {
    return category.type === addonType && category.application === clientApp;
  }).sort((a, b) => {
    return a.name > b.name;
  });
}

export class CategoriesBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    categories: PropTypes.arrayOf(PropTypes.object),
    clientApp: PropTypes.string.isRequired,
    error: PropTypes.bool,
    loading: PropTypes.bool.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const {
      addonType, categories, clientApp, error, loading, i18n,
    } = this.props;

    if (loading && !categories.length) {
      return <div>{i18n.gettext('Loading...')}</div>;
    }

    if (error) {
      return <div>{i18n.gettext('Failed to load categories.')}</div>;
    }

    const categoriesToShow = filterAndSortCategories(
      categories, addonType, clientApp);

    if (!loading && !categoriesToShow.length) {
      return <div>{i18n.gettext('No categories found.')}</div>;
    }

    return (
      <div className="Categories">
        <ul className="Categories-list"
          ref={(ref) => { this.categories = ref; }}>
          {categoriesToShow.map((category) => {
            const queryParams = { category: category.slug, type: addonType };
            return (
              <li className="Categories-list-item">
                <Link className="Categories-link"
                  to={{ pathname: '/search/', query: queryParams }}>
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(CategoriesBase);
