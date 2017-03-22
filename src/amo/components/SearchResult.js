import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import fallbackIcon from 'amo/img/icons/default-64.png';
import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import Rating from 'ui/components/Rating';
import { ADDON_TYPE_THEME } from 'core/constants';
import { isAllowedOrigin } from 'core/utils';

import 'core/css/SearchResult.scss';


export class SearchResultBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addon, i18n } = this.props;
    const averageDailyUsers = addon.average_daily_users;
    const isTheme = addon.type === ADDON_TYPE_THEME;
    const resultClassnames = classNames('SearchResult', {
      'SearchResult--theme': isTheme,
    });

    // Fall-back to default icon if invalid icon url.
    const iconURL = isAllowedOrigin(addon.icon_url) ? addon.icon_url : fallbackIcon;
    const themeURL = (addon.theme_data && isAllowedOrigin(addon.theme_data.previewURL)) ?
      addon.theme_data.previewURL : null;
    const imageURL = isTheme ? themeURL : iconURL;

    // Sets classes to handle fallback if theme preview is not available.
    const iconWrapperClassnames = classNames('SearchResult-icon-wrapper', {
      'SearchResult-icon-wrapper--notheme': isTheme && imageURL === null,
    });

    return (
      <li className={resultClassnames}>
        <Link to={`/addon/${addon.slug}/`}
              className="SearchResult-link"
              ref={(el) => { this.name = el; }}>
          <section className="SearchResult-main">
            <div className={iconWrapperClassnames}>
              {imageURL ?
                <img className="SearchResult-icon" src={imageURL} alt="" /> :
                <p className="SearchResult-notheme">{i18n.gettext('No theme preview available')}</p>}
            </div>
            <h2 className="SearchResult-heading">{addon.name}</h2>
            <div className="SearchResult-rating">
              <Rating rating={addon.ratings.average} readOnly
                styleName="small" />
            </div>
            { addon.authors && addon.authors.length ?
              <h3 className="SearchResult-author">{addon.authors[0].name}</h3> : null }
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
