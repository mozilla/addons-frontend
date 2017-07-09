import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import { ADDON_TYPE_THEME } from 'core/constants';
import { isAllowedOrigin, sanitizeHTML } from 'core/utils';
import { getAddonIconUrl } from 'core/imageUtils';
import Icon from 'ui/components/Icon';
import Rating from 'ui/components/Rating';

import './styles.scss';


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
    const iconURL = getAddonIconUrl(addon);
    const themeURL = (addon.theme_data && isAllowedOrigin(addon.theme_data.previewURL)) ?
      addon.theme_data.previewURL : null;
    const imageURL = isTheme ? themeURL : iconURL;

    // Sets classes to handle fallback if theme preview is not available.
    const iconWrapperClassnames = classNames('SearchResult-icon-wrapper', {
      'SearchResult-icon-wrapper--no-theme-image': (
        isTheme && imageURL === null
      ),
    });

    /* eslint-disable react/no-danger */
    return (
      <li className={resultClassnames}>
        <Link
          to={`/addon/${addon.slug}/`}
          className="SearchResult-link"
          ref={(el) => { this.name = el; }}
        >
          <div className={iconWrapperClassnames}>
            {imageURL ? (
              <img className="SearchResult-icon" src={imageURL} alt="" />
            ) : (
              <p className="SearchResult-notheme">
                {i18n.gettext('No theme preview available')}
              </p>
            )}
          </div>

          <div className="SearchResult-contents">
            <h2 className="SearchResult-name">{addon.name}</h2>
            <p
              className="SearchResult-summary"
              dangerouslySetInnerHTML={sanitizeHTML(addon.summary)}
            />

            <div className="SearchResult-metadata">
              <div className="SearchResult-rating">
                <Rating
                  rating={addon.ratings.average}
                  readOnly
                  styleName="small"
                />
              </div>
              { addon.authors && addon.authors.length ? (
                <h3 className="SearchResult-author SearchResult--meta-section">
                  {addon.authors[0].name}
                </h3>
              ) : null }
            </div>
          </div>

          <h3 className="SearchResult-users SearchResult--meta-section">
            <Icon className="SearchResult-users-icon" name="user-fill" />
            <span className="SearchResult-users-text">
              {i18n.sprintf(i18n.ngettext(
                '%(total)s user', '%(total)s users', averageDailyUsers),
                { total: i18n.formatNumber(averageDailyUsers) },
              )}
            </span>
          </h3>
        </Link>
      </li>
    );
    /* eslint-enable react/no-danger */
  }
}

export default compose(
  translate({ withRef: true }),
)(SearchResultBase);
