/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import AppBanner from 'amo/components/AppBanner';
import Link from 'amo/components/Link';
import { addParamsToHeroURL, checkInternalURL, getAddonURL } from 'amo/utils';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import tracking from 'core/tracking';
import { sanitizeUserHTML } from 'core/utils';
import type { PrimaryHeroShelfType } from 'amo/reducers/home';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

export const PRIMARY_HERO_CLICK_CATEGORY = 'AMO Primary Hero Clicks';
export const PRIMARY_HERO_SRC = 'homepage-primary-hero';

type Props = {|
  shelfData: PrimaryHeroShelfType,
|};

type InternalProps = {|
  ...Props,
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
    const { _checkInternalURL, i18n, shelfData } = this.props;
    const { addon, description, external, gradient, featuredImage } = shelfData;

    const linkInsides = <span> {i18n.gettext('Get the extension')} </span>;

    let heading;
    let link;

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

    // translators: If uppercase does not work in your locale, change it to lowercase.
    // This is used as a secondary heading.
    const recommended = i18n.gettext('RECOMMENDED');
    const gradientsClassName = `HeroRecommendation-${gradient.start}-${gradient.end}`;
    log.info(
      `className ${gradientsClassName} generated from the API response. This should match a selector in styles.scss`,
    );

    return (
      <section
        className={makeClassName('HeroRecommendation', gradientsClassName, {
          'HeroRecommendation--no-image': !featuredImage,
        })}
      >
        <div className="HeroRecommendation-wrapper">
          <AppBanner className="HeroRecommendation-banner" />

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
                {recommended}
              </div>
              <h2 className="HeroRecommendation-heading">{heading}</h2>
              <div
                className="HeroRecommendation-body"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={sanitizeUserHTML(description)}
              />
              {link}
            </div>
          </div>
        </div>
      </section>
    );
  }
}

const HeroRecommendation: React.ComponentType<Props> = compose(translate())(
  HeroRecommendationBase,
);

export default HeroRecommendation;
