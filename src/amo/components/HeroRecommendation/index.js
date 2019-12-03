/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AppBanner from 'amo/components/AppBanner';
import Link from 'amo/components/Link';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import { addParamsToHeroURL, checkInternalURL, getAddonURL } from 'amo/utils';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import tracking from 'core/tracking';
import { sanitizeUserHTML } from 'core/utils';
import LoadingText from 'ui/components/LoadingText';
import type { PrimaryHeroShelfType } from 'amo/reducers/home';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export const PRIMARY_HERO_CLICK_CATEGORY = 'AMO Primary Hero Clicks';
export const PRIMARY_HERO_SRC = 'homepage-primary-hero';

type Props = {|
  errorHandler: ErrorHandlerType,
  shelfData?: PrimaryHeroShelfType,
|};

type MappedProps = {|
  siteIsReadOnly: boolean,
  siteNotice: string | null,
|};

export type InternalProps = {|
  ...Props,
  ...MappedProps,
  i18n: I18nType,
  _checkInternalURL: typeof checkInternalURL,
  _tracking: typeof tracking,
|};

export class HeroRecommendationBase extends React.Component<InternalProps> {
  static defaultProps = {
    _checkInternalURL: checkInternalURL,
    _tracking: tracking,
  };

  makeCallToActionURL = () => {
    const { shelfData } = this.props;
    invariant(shelfData, 'The shelfData property is required');

    const { addon, external } = shelfData;

    if (addon) {
      return addParamsToHeroURL({
        heroSrcCode: PRIMARY_HERO_SRC,
        urlString: getAddonURL(addon.slug),
      });
    }

    invariant(external, 'Either an addon or an external is required');
    return addParamsToHeroURL({
      heroSrcCode: PRIMARY_HERO_SRC,
      urlString: external.homepage,
    });
  };

  onHeroClick = () => {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: this.makeCallToActionURL(),
      category: PRIMARY_HERO_CLICK_CATEGORY,
    });
  };

  render() {
    const {
      _checkInternalURL,
      i18n,
      errorHandler,
      shelfData,
      siteIsReadOnly,
      siteNotice,
    } = this.props;
    const { addon, description, external, featuredImage, gradient } =
      shelfData || {};

    let gradientsClassName;
    let heading;
    let link;

    const heightClassName =
      siteIsReadOnly || siteNotice
        ? 'HeroRecommendation--height-with-notice'
        : 'HeroRecommendation--height-without-notice';

    if (shelfData) {
      gradientsClassName = `HeroRecommendation-${gradient.start}-${gradient.end}`;
      log.info(
        `className ${gradientsClassName} generated from the API response. This should match a selector in styles.scss`,
      );

      const linkInsides = <span> {i18n.gettext('Get the extension')} </span>;
      const linkProps = _checkInternalURL({
        urlString: this.makeCallToActionURL(),
      }).isInternal
        ? {}
        : { rel: 'noopener noreferrer', target: '_blank' };

      if (addon) {
        heading = addon.name;
        link = (
          <Link
            className="HeroRecommendation-link"
            onClick={this.onHeroClick}
            to={this.makeCallToActionURL()}
          >
            {linkInsides}
          </Link>
        );
      } else if (external) {
        heading = external.name;
        link = (
          <a
            className="HeroRecommendation-link"
            href={this.makeCallToActionURL()}
            onClick={this.onHeroClick}
            {...linkProps}
          >
            {linkInsides}
          </a>
        );
      }
    } else {
      gradientsClassName = `HeroRecommendation--loading`;
    }

    return (
      <section
        className={makeClassName(
          'HeroRecommendation',
          gradientsClassName,
          heightClassName,
          {
            'HeroRecommendation--no-image': !featuredImage,
          },
        )}
      >
        <div className="HeroRecommendation-wrapper">
          {/* The AppBanner is included here as it wants to live inside the
          HeroRecommendation on the home page. All other pages in the app
          include it via the Page component. */}
          <AppBanner className="HeroRecommendation-banner" />
          {/* The WrongPlatformWarning is included here as it wants to live
          inside the HeroRecommendation on the home page. Most other pages in
          the app include it via the Page component. */}
          <WrongPlatformWarning className="HeroRecommendation-WrongPlatformWarning" />

          {errorHandler.renderErrorIfPresent()}

          <div className="HeroRecommendation-content">
            {featuredImage && (
              <div>
                <img
                  className="HeroRecommendation-image"
                  alt=""
                  src={featuredImage}
                />
              </div>
            )}
            <div className="HeroRecommendation-info">
              <div className="HeroRecommendation-recommended">
                {shelfData ? (
                  // translators: If uppercase does not work in your locale,
                  // change it to lowercase. This is used as a secondary heading.
                  i18n.gettext('RECOMMENDED')
                ) : (
                  <LoadingText width={20} />
                )}
              </div>
              <h2 className="HeroRecommendation-heading">
                {heading || <LoadingText width={60} />}
              </h2>
              {description ? (
                <div
                  className="HeroRecommendation-body"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={sanitizeUserHTML(description)}
                />
              ) : (
                <div className="HeroRecommendation-body">
                  <>
                    <LoadingText width={100} />
                    <br />
                    <LoadingText width={80} />
                  </>
                </div>
              )}
              {link}
            </div>
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = (state: AppState): MappedProps => {
  return {
    siteIsReadOnly: state.site.readOnly,
    siteNotice: state.site.notice,
  };
};

const HeroRecommendation: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(HeroRecommendationBase);

export default HeroRecommendation;
