/* @flow */
import url from 'url';

import config from 'config';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import { isInternalURL, getAddonURL } from 'amo/utils';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';
import { addQueryParams, sanitizeUserHTML } from 'core/utils';
import type { PrimaryHeroShelfType } from 'amo/reducers/home';
import type { I18nType } from 'core/types/i18n';

import { getDecoration } from './decorations';
import './styles.scss';

export const PRIMARY_HERO_CLICK_CATEGORY = 'AMO Primary Hero Clicks';
export const PRIMARY_HERO_SRC = 'homepage-primary-hero';

type Props = {|
  shelfData: PrimaryHeroShelfType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  _isInternalURL: typeof isInternalURL,
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
  static defaultProps = {
    _isInternalURL: isInternalURL,
    _tracking: tracking,
  };

  decoration: React.Element<any>;

  makeCallToActionURL = () => {
    const { shelfData } = this.props;
    invariant(shelfData, 'The shelfData property is required');

    const { addon, external } = shelfData;

    if (addon) {
      return addParamsToHeroURL({
        urlString: getAddonURL(addon.slug),
      });
    }

    invariant(external, 'Either an addon or an external is required');
    return addParamsToHeroURL({
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
    const { _isInternalURL, i18n, shelfData } = this.props;
    const { addon, description, external, featuredImage } = shelfData;

    if (!this.decoration) {
      this.decoration = getDecoration();
    }

    const linkInsides = <span> {i18n.gettext('Get the extension')} </span>;

    let heading;
    let link;

    const linkProps = _isInternalURL({ urlString: this.makeCallToActionURL() })
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
        {this.decoration}
      </section>
    );
  }
}

const HeroRecommendation: React.ComponentType<Props> = compose(translate())(
  HeroRecommendationBase,
);

export default HeroRecommendation;
