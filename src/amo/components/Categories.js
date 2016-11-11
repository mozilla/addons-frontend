import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import './Categories.scss';


export class CategoriesBase extends React.Component {
  static propTypes = {
    addonType: PropTypes.string.isRequired,
    categories: PropTypes.object.isRequired,
    error: PropTypes.bool,
    loading: PropTypes.bool.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addonType, categories, error, loading, i18n } = this.props;

    if (loading) {
      return (
        <div className="Categories">
          <p>{i18n.gettext('Loading...')}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="Categories">
          <p>{i18n.gettext('Failed to load categories.')}</p>
        </div>
      );
    }

    if (!Object.values(categories).length) {
      return (
        <div className="Categories">
          <p>{i18n.gettext('No categories found.')}</p>
        </div>
      );
    }

    return (
      <div className="Categories">
        <ul className="Categories-list"
          ref={(ref) => { this.categories = ref; }}>
          {Object.values(categories).map((category) => (
            <li className="Categories-list-item">
              <Link className="Categories-link"
                to={`/${addonType}s/categories/${category.slug}/`}>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(CategoriesBase);
