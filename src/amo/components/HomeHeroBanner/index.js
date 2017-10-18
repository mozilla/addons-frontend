/* @flow */
import React from 'react';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION } from 'core/constants';
import translate from 'core/i18n/translate';
import Hero from 'ui/components/Hero';
import HeroSection from 'ui/components/HeroSection';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  i18n: I18nType,
|};

export class HomeHeroBannerBase extends React.Component<Props> {
  sections() {
    const { i18n } = this.props;

    return [
      (
        <HeroSection
          key="featured-extensions"
          linkTo={{
            pathname: '/search/',
            query: convertFiltersToQueryParams({
              addonType: ADDON_TYPE_EXTENSION,
              featured: true,
            }),
          }}
          styleName="Home-featured-extensions"
        >
          <h3>{i18n.gettext('Featured extensions')}</h3>

          <p>{i18n.gettext('Excellent extensions for all situations')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="youtube-high-definition"
          linkTo="/addon/youtube-high-definition/"
          styleName="Home-youtube-high-definition"
        >
          <h3>{i18n.gettext('YouTube High Definition')}</h3>

          <p>
            {i18n.gettext(`Videos in HD, turn off annotations,
              change player size & more`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="privacy-matters"
          linkTo="/collections/mozilla/privacy-matters/"
          styleName="Home-privacy-matters"
        >
          <h3>{i18n.gettext('Block ads')}</h3>

          <p>
            {i18n.gettext(`From ad blockers to anti-trackers, here
              are some impressive privacy extensions`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="ublock-origin"
          linkTo="/addon/ublock-origin/"
          styleName="Home-ublock-origin"
        >
          <h3>{i18n.gettext('uBlock Origin')}</h3>
          <p>
            {i18n.gettext(`An extremely powerful ad blocker that’s simple
              to use`)}
          </p>
        </HeroSection>
      ),
    ];
  }

  render() {
    return (
      <div className="HomeHeroBanner">
        <Hero
          name="Home"
          random
          sections={this.sections()}
        />
      </div>
    );
  }
}

export default compose(
  translate(),
)(HomeHeroBannerBase);
