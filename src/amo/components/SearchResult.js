import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';

import 'core/css/SearchResult.scss';


export class SearchResultBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addon, i18n } = this.props;
    const averageDailyUsers = addon.average_daily_users;

    // TODO: Implement a rating component and style the stars.
    const rating = addon.ratings && addon.ratings.average ? (
      <h3 className="SearchResult-rating">
        <span className="visually-hidden">{i18n.sprintf(
          i18n.gettext('Average rating: %(rating)s out of 5'),
          { rating: Math.round(addon.ratings.average * 2) / 2 }
        )}</span>
      </h3>
    ) : (
      <h3 className="SearchResult-rating visually-hidden">
        {i18n.gettext('No ratings')}
      </h3>
    );
    return (
      <li className="SearchResult">
        <Link to={`/addon/${addon.slug}-harm/`}
              className="SearchResult-link"
              ref={(el) => { this.name = el; }}>
          <section className="SearchResult-main">
            <img className="SearchResult-icon" src={addon.icon_url} alt="" />
            <h2 className="SearchResult-heading">{addon.name}</h2>
            {rating}
            <h3 className="SearchResult-author">{addon.authors[0].name}</h3>
            <h3 className="SearchResult-users">{i18n.sprintf(
              i18n.ngettext('%(total)s user', '%(total)s users', averageDailyUsers),
              { total: i18n.formatNumber(averageDailyUsers) },
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
