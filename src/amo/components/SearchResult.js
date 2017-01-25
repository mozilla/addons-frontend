import React, { PropTypes } from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import Rating from 'ui/components/Rating';

import 'core/css/SearchResult.scss';


export class SearchResultBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addon, i18n } = this.props;
    const averageDailyUsers = addon.average_daily_users;

    const rating = addon.ratings && addon.ratings.average ? (
      // TODO: round up/down average ratings.
      <Rating rating={addon.ratings.average} readOnly size="small" />
    ) : (
      // TODO: hmm, make this part of Rating?
      <h3 className="visually-hidden">{i18n.gettext('No ratings')}</h3>
    );
    return (
      <li className="SearchResult">
        <Link to={`/addon/${addon.slug}/`}
              className="SearchResult-link"
              ref={(el) => { this.name = el; }}>
          <section className="SearchResult-main">
            <img className="SearchResult-icon" src={addon.icon_url} alt="" />
            <h2 className="SearchResult-heading">{addon.name}</h2>
            <div className="SearchResult-rating">{rating}</div>
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
