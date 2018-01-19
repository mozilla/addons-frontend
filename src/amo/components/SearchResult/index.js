import makeClassName from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import { ADDON_TYPE_THEME } from 'core/constants';
import { isAllowedOrigin, sanitizeHTML } from 'core/utils';
import { getAddonIconUrl } from 'core/imageUtils';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';

import './styles.scss';


export class SearchResultBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    showMetadata: PropTypes.bool,
    showSummary: PropTypes.bool,
  }

  static defaultProps = {
    showMetadata: true,
    showSummary: true,
  };

  addonIsTheme() {
    const { addon } = this.props;
    return addon && addon.type === ADDON_TYPE_THEME;
  }

  renderResult() {
    const { addon, i18n, showMetadata, showSummary } = this.props;

    const isTheme = this.addonIsTheme();
    const averageDailyUsers = addon && addon.average_daily_users;

    // Fall-back to default icon if invalid icon url.
    const iconURL = getAddonIconUrl(addon);
    const themeURL = (addon && addon.themeData &&
      isAllowedOrigin(addon.themeData.previewURL)) ?
      addon.themeData.previewURL : null;
    const imageURL = isTheme ? themeURL : iconURL;

    // Sets classes to handle fallback if theme preview is not available.
    const iconWrapperClassnames = makeClassName('SearchResult-icon-wrapper', {
      'SearchResult-icon-wrapper--no-theme-image': (
        isTheme && imageURL === null
      ),
    });

    let addonAuthors = null;
    const addonAuthorsData = addon && addon.authors && addon.authors.length ?
      addon.authors : null;
    if (!addon || addonAuthorsData) {
      addonAuthors = (
        <h3 className="SearchResult-author SearchResult--meta-section">
          {addon ? addonAuthorsData[0].name : <LoadingText />}
        </h3>
      );
    }

    let summary = null;
    if (showSummary) {
      const summaryProps = {};
      if (addon) {
        summaryProps.dangerouslySetInnerHTML = sanitizeHTML(addon.summary);
      } else {
        summaryProps.children = <LoadingText />;
      }

      summary = <p className="SearchResult-summary" {...summaryProps} />;
    }

    return (
      <div className="SearchResult-result">
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
          <h2 className="SearchResult-name">
            {addon ? addon.name : <LoadingText />}
          </h2>
          {summary}

          {showMetadata ? (
            <div className="SearchResult-metadata">
              <div className="SearchResult-rating">
                <Rating
                  rating={addon ? addon.ratings.average : 0}
                  readOnly
                  styleName="small"
                />
              </div>
              {addonAuthors}
            </div>
          ) : null}
        </div>

        <h3 className="SearchResult-users SearchResult--meta-section">
          <Icon className="SearchResult-users-icon" name="user-fill" />
          <span className="SearchResult-users-text">
            {addon ? i18n.sprintf(i18n.ngettext(
              '%(total)s user', '%(total)s users', averageDailyUsers),
            { total: i18n.formatNumber(averageDailyUsers) },
            ) : <LoadingText width={90} />}
          </span>
        </h3>
      </div>
    );
  }

  render() {
    const { addon } = this.props;

    const result = this.renderResult();
    const isTheme = this.addonIsTheme();
    const resultClassnames = makeClassName('SearchResult', {
      'SearchResult--theme': isTheme,
    });

    return (
      <li className={resultClassnames}>
        {addon ?
          <Link
            to={`/addon/${addon.slug}/`}
            className="SearchResult-link"
            ref={(el) => { this.name = el; }}
          >
            {result}
          </Link>
          : result
        }
      </li>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(SearchResultBase);
