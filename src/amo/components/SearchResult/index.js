/* @flow */
/* eslint-disable react/sort-comp */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import { ADDON_TYPE_THEME, ADDON_TYPE_THEMES } from 'core/constants';
import { addQueryParams, isAllowedOrigin, nl2br, sanitizeHTML } from 'core/utils';
import { getAddonIconUrl } from 'core/imageUtils';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import type { AddonType, CollectionAddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType | CollectionAddonType,
  addonInstallSource?: string,
  i18n: I18nType,
  showMetadata?: boolean,
  showSummary?: boolean,
|};

export class SearchResultBase extends React.Component<Props> {
  static defaultProps = {
    showMetadata: true,
    showSummary: true,
  };

  addonIsTheme() {
    const { addon } = this.props;
    return addon && ADDON_TYPE_THEMES.includes(addon.type);
  }

  renderResult() {
    const { addon, i18n, showMetadata, showSummary } = this.props;

    const isTheme = this.addonIsTheme();
    const averageDailyUsers = addon && addon.average_daily_users;

    // Fall-back to default icon if invalid icon url.
    const iconURL = getAddonIconUrl(addon);

    let imageURL = iconURL;

    if (isTheme) {
      let themeURL = addon.previews &&
        addon.previews.length > 0 &&
        isAllowedOrigin(addon.previews[0].image_url) ?
        addon.previews[0].image_url : null;

      if (!themeURL && addon.type === ADDON_TYPE_THEME) {
        themeURL = addon.themeData
          && isAllowedOrigin(addon.themeData.previewURL)
          ? addon.themeData.previewURL : null;
      }

      imageURL = themeURL;
    }

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
      // TODO: list all authors.
      // https://github.com/mozilla/addons-frontend/issues/4461
      const author = addonAuthorsData && addonAuthorsData[0];
      addonAuthors = (
        <h3 className="SearchResult-author SearchResult--meta-section">
          {author ? author.name : <LoadingText />}
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
                  rating={addon && addon.ratings ? addon.ratings.average : 0}
                  readOnly
                  styleSize="small"
                />
              </div>
              {addonAuthors}
            </div>
          ) : null}

          {addon && addon.notes && (
            <div className="SearchResult-note">
              <h4 className="SearchResult-note-header">
                <Icon name="comments-blue" />
                {i18n.gettext('Add-on note')}
              </h4>
              <p
                className="SearchResult-note-content"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={
                  sanitizeHTML(nl2br(addon.notes), ['br'])
                }
              />
            </div>
          )}
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
    const { addon, addonInstallSource } = this.props;

    const result = this.renderResult();
    const isTheme = this.addonIsTheme();
    const resultClassnames = makeClassName('SearchResult', {
      'SearchResult--theme': isTheme,
      'SearchResult--persona': addon && addon.type === ADDON_TYPE_THEME,
    });

    let item = result;
    if (addon) {
      let linkTo = `/addon/${addon.slug}/`;
      if (addonInstallSource) {
        linkTo = addQueryParams(linkTo, { src: addonInstallSource });
      }
      item = (
        <Link to={linkTo} className="SearchResult-link">
          {result}
        </Link>
      );
    }

    return (
      <li className={resultClassnames}>{item}</li>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(SearchResultBase);
