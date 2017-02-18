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
    return (
      <li className="SearchResult">
        <Link to={`/addon/${addon.slug}/`}
              className="SearchResult-link"
              ref={(el) => { this.name = el; }}>
          <section className="SearchResult-main">
            <img className="SearchResult-icon" src={addon.icon_url} alt="" />
            <h2 className="SearchResult-heading">{addon.name}</h2>
            <div className="SearchResult-rating">
              <Rating rating={addon.ratings.average} readOnly size="small" />
            </div>
            <h3 className="SearchResult-author-users">
              <span className="SearchResult-author">{addon.authors[0].name}</span>
              <span className="SearchResult-users">{i18n.sprintf(
                i18n.ngettext(' — %(total)s user', ' — %(total)s users', averageDailyUsers),
                { total: i18n.formatNumber(averageDailyUsers) },
              )}</span>
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
