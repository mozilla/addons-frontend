/* @flow */
import url from 'url';

import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import AddonTitle from 'amo/components/AddonTitle';
import Link from 'amo/components/Link';
import { isInternalURL } from 'amo/utils';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';
import { addQueryParams, sanitizeUserHTML } from 'core/utils';
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
  _tracking: typeof tracking,
|};

type QueryParams = { [key: string]: any };

type AddParamsToHeroURLParams = {|
  _addQueryParams?: typeof addQueryParams,
  _config?: typeof config,
  _isInternalURL?: typeof isInternalURL,
  heroSrcCode?: string,
  internalQueryParams?: QueryParams,
  externalQueryParams?: QueryParams,
  urlString: string,
|};

export const addParamsToHeroURL = ({
  _addQueryParams = addQueryParams,
  _config = config,
  _isInternalURL = isInternalURL,
  heroSrcCode = PRIMARY_HERO_SRC,
  internalQueryParams = { src: heroSrcCode },
  externalQueryParams = {
    utm_content: heroSrcCode,
    utm_medium: 'referral',
    utm_source: url.parse(_config.get('baseURL')).host,
  },
  urlString,
}: AddParamsToHeroURLParams) => {
  return _addQueryParams(
    urlString,
    _isInternalURL({ urlString }) ? internalQueryParams : externalQueryParams,
  );
};

export class HeroRecommendationBase extends React.Component<InternalProps> {
  callToActionURL: string;

  static defaultProps = {
    _tracking: tracking,
  };

  makeCallToActionURL = () => {
    const { shelfData } = this.props;
    invariant(shelfData, 'The shelfData property is required');

    const { addon, external } = shelfData;

    if (addon) {
      return addParamsToHeroURL({
        urlString: `/addon/${addon.slug}/`,
      });
    }
    if (external) {
      return addParamsToHeroURL({
        urlString: external.homepage,
      });
    }
    // This isn't possible because an internal HeroShelves object cannot be
    // created without either an addon or an external, but eslint wants us to
    // return something.
    /* istanbul ignore next */
    return '';
  };

  onHeroClick = () => {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: this.makeCallToActionURL(),
      category: PRIMARY_HERO_CLICK_CATEGORY,
    });
  };

  renderOverlayShape() {
    const gradientA = 'HeroRecommendation-gradient-a';
    const gradientB = 'HeroRecommendation-gradient-b';

    return (
      <svg
        className="HeroRecommendation-overlayShape"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 334 307"
      >
        <defs>
          <linearGradient
            id={gradientA}
            x1="37.554%"
            x2="20.41%"
            y1="51.425%"
            y2="49.159%"
          >
            <stop
              className="HeroRecommendation-gradientA-startColor"
              offset="0%"
            />
            <stop
              className="HeroRecommendation-gradientA-endColor"
              offset="100%"
            />
          </linearGradient>
          <linearGradient
            id={gradientB}
            x1="0%"
            x2="100%"
            y1="36.092%"
            y2="36.092%"
          >
            <stop
              className="HeroRecommendation-gradientB-startColor"
              offset="0%"
            />
            <stop
              className="HeroRecommendation-gradientB-endColor"
              offset="100%"
            />
          </linearGradient>
        </defs>
        <g fill="none">
          <path
            className="HeroRecommendation-solidSwoosh"
            d="M0 307h267c-52.113-48.37-94.22-112.103-120.226-188.126C122.438 47.736 63.457 3.044 0 0v307z"
          />
          <path
            fill={`url(#${gradientA})`}
            d="M0 307c17.502-9.934 34.574-21.458 51.072-34.602C121.246 216.49 216.932 232.615 271 307H0z"
            transform="matrix(-1 0 0 1 334 0)"
          />
          <path
            fill={`url(#${gradientB})`}
            d="M334 307H114c31.79-24.866 61.545-54.258 88.533-88.135C237.964 174.386 285.12 148.906 334 143v164z"
            transform="matrix(-1 0 0 1 334 0)"
          />
        </g>
      </svg>
    );
  }

  render() {
    const { i18n, shelfData } = this.props;
    const { addon, description, external, featuredImage } = shelfData;

    const linkInsides = <span> {i18n.gettext('Get the extension')} </span>;

    let heading;
    let link;

    if (addon) {
      heading = <AddonTitle addon={addon} as="div" />;
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
        >
          {linkInsides}
        </a>
      );
    }

    // translators: If uppercase does not work in your locale, change it to lowercase.
    // This is used as a secondary heading.
    const recommended = i18n.gettext('RECOMMENDED');

    return (
      <section className="HeroRecommendation HeroRecommendation-purple">
        <div>
          <img
            className="HeroRecommendation-image"
            alt=""
            src={featuredImage}
          />
        </div>
        <div className="HeroRecommendation-info">
          <div className="HeroRecommendation-recommended">{recommended}</div>
          <h2 className="HeroRecommendation-heading">{heading}</h2>
          <div
            className="HeroRecommendation-body"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeUserHTML(description)}
          />
          {link}
        </div>
        {this.renderOverlayShape()}
      </section>
    );
  }
}

const HeroRecommendation: React.ComponentType<Props> = compose(translate())(
  HeroRecommendationBase,
);

export default HeroRecommendation;
