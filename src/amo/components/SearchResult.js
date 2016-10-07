import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import translate from 'core/i18n/translate';

import 'core/css/SearchResult.scss';

class SearchResult extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
    result: PropTypes.object.isRequired,
  }

  render() {
    const { i18n, lang, result } = this.props;
    return (
      <li className="SearchResult">
        <Link to={`/${lang}/firefox/addon/${result.slug}/`}
              className="SearchResult-link"
              ref={(el) => { this.name = el; }}>
          <section className="SearchResult-main">
            <img className="SearchResult-icon" src={result.icon_url} alt="" />
            <h2 className="SearchResult-heading">{result.name}</h2>
            <h3 className="SearchResult-rating">
              <span className="visually-hidden">4/5</span>
            </h3>
            <h3 className="SearchResult-author">{result.authors[0].name}</h3>
            <h3 className="SearchResult-users">{i18n.sprintf(
              i18n.ngettext('%(users)s user', '%(users)s users',
                            result.average_daily_users),
              { users: result.average_daily_users }
            )}
            </h3>
          </section>
        </Link>
      </li>
    );
  }
}

export default translate({ withRef: true })(SearchResult);
