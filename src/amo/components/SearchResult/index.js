/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import { getAddonURL } from 'amo/utils';
import translate from 'core/i18n/translate';
import {
  ADDON_TYPE_OPENSEARCH,
  CLIENT_APP_ANDROID,
  ADDON_TYPE_STATIC_THEME,
} from 'core/constants';
import { addQueryParams, nl2br, sanitizeHTML } from 'core/utils';
import { getAddonIconUrl, getPreviewImage } from 'core/imageUtils';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import RecommendedBadge from 'ui/components/RecommendedBadge';
import type { AppState } from 'amo/store';
import type { AddonType, CollectionAddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterHistoryType } from 'core/types/router';

import './styles.scss';

type Props = {|
  addon?: AddonType | CollectionAddonType,
  addonInstallSource?: string,
  showMetadata?: boolean,
  showRecommendedBadge?: boolean,
  showSummary?: boolean,
  useThemePlaceholder?: boolean,
|};

type InternalProps = {|
  ...Props,
  clientApp: string,
  history: ReactRouterHistoryType,
  i18n: I18nType,
  lang: string,
|};

export class SearchResultBase extends React.Component<InternalProps> {
  static defaultProps = {
    showMetadata: true,
    showRecommendedBadge: true,
    showSummary: true,
    useThemePlaceholder: false,
  };

  getAddonLink(
    addon: AddonType | CollectionAddonType,
    addonInstallSource?: string,
  ) {
    let linkTo = getAddonURL(addon.slug);
    if (addonInstallSource) {
      linkTo = addQueryParams(linkTo, { src: addonInstallSource });
    }
    return linkTo;
  }

  renderResult() {
    const {
      addon,
      addonInstallSource,
      clientApp,
      i18n,
      showMetadata,
      showRecommendedBadge,
      showSummary,
      useThemePlaceholder,
    } = this.props;

    const averageDailyUsers = addon ? addon.average_daily_users : null;

    // Fall-back to default icon if invalid icon url.
    const iconURL = getAddonIconUrl(addon);

    let imageURL = iconURL;
    let addonTitle = <LoadingText />;

    if (addon) {
      addonTitle = <span className="SearchResult-title">{addon.name}</span>;
    }

    if (addon && addon.type === ADDON_TYPE_STATIC_THEME) {
      imageURL = getPreviewImage(addon);
    }

    // Sets classes to handle fallback if theme preview is not available.
    const iconWrapperClassnames = makeClassName('SearchResult-icon-wrapper', {
      'SearchResult-icon-wrapper--no-theme-image': addon
        ? imageURL === null
        : useThemePlaceholder,
    });

    let addonAuthors = null;
    const addonAuthorsData =
      addon && addon.authors && addon.authors.length ? addon.authors : null;
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
      <Link
        href={addon ? this.getAddonLink(addon, addonInstallSource) : '#'}
        className="SearchResult-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="SearchResult-result">
          <div className={iconWrapperClassnames}>
            {(addon && imageURL) || (!addon && !useThemePlaceholder) ? (
              <img
                className={makeClassName('SearchResult-icon', {
                  'SearchResult-icon--loading': !addon,
                })}
                src={imageURL}
                alt={addon ? `${addon.name}` : ''}
              />
            ) : (
              <p className="SearchResult-notheme">
                {i18n.gettext('No theme preview available')}
              </p>
            )}
          </div>

          <div className="SearchResult-contents">
            <h2 className="SearchResult-name">
              {addonTitle}
              {showRecommendedBadge &&
              addon &&
              addon.is_recommended &&
              clientApp !== CLIENT_APP_ANDROID ? (
                <RecommendedBadge
                  onClick={(e) => e.stopPropagation()}
                  size="small"
                />
              ) : null}
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
                  dangerouslySetInnerHTML={sanitizeHTML(nl2br(addon.notes), [
                    'br',
                  ])}
                />
              </div>
            )}
          </div>

          {!addon || (addon && addon.type !== ADDON_TYPE_OPENSEARCH) ? (
            <h3 className="SearchResult-users SearchResult--meta-section">
              <Icon className="SearchResult-users-icon" name="user-fill" />
              <span className="SearchResult-users-text">
                {averageDailyUsers !== null &&
                averageDailyUsers !== undefined ? (
                  i18n.sprintf(
                    i18n.ngettext(
                      '%(total)s user',
                      '%(total)s users',
                      averageDailyUsers,
                    ),
                    { total: i18n.formatNumber(averageDailyUsers) },
                  )
                ) : (
                  <LoadingText width={90} />
                )}
              </span>
            </h3>
          ) : null}
        </div>
      </Link>
    );
  }

  render() {
    const { addon, useThemePlaceholder } = this.props;

    const result = this.renderResult();
    const resultClassnames = makeClassName('SearchResult', {
      'SearchResult--theme': addon
        ? ADDON_TYPE_STATIC_THEME === addon.type
        : useThemePlaceholder,
    });

    return (
      // Note: The link in question is still keyboard accessible because we've
      // added an actual link to the h2 tag.
      // eslint-disable-next-line max-len
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
      <li className={resultClassnames}>{result}</li>
    );
  }
}

export const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
};

const SearchResult: React.ComponentType<Props> = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(SearchResultBase);

export default SearchResult;
