import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import 'core/css/SearchResult.scss';


export class SearchResultBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
    result: PropTypes.object.isRequired,
  }

  render() {
    const { i18n, result } = this.props;

    // TODO: Implement a rating component and style the stars.
    const rating = result.ratings && result.ratings.average ? (
      <h3 className="SearchResult-rating">
        <span className="visually-hidden">{i18n.sprintf(
          i18n.gettext('Average rating: %(rating)s out of 5'),
          { rating: Math.round(result.ratings.average * 2) / 2 }
        )}</span>
      </h3>
    ) : (
      <h3 className="SearchResult-rating visually-hidden">
        {i18n.gettext('No ratings')}
      </h3>
    );
    return (
      <li className="SearchResult">
        <Link to={`/addon/${result.slug}/`}
              className="SearchResult-link"
              ref={(el) => { this.name = el; }}>
          <section className="SearchResult-main">
            <img className="SearchResult-icon" src={result.icon_url} alt="" />
            <h2 className="SearchResult-heading">{result.name}</h2>
            {rating}
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

export default compose(
  translate({ withRef: true }),
)(SearchResultBase);
