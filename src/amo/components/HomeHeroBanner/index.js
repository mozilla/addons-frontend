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
            {i18n.gettext(`Play videos in HD, turn off annotations, change
              player size & more`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="productivity"
          linkTo="/collections/mozilla/be-more-productive/"
          styleName="Home-productivity"
        >
          <h3>{i18n.gettext('Productivity extensions')}</h3>

          <p>
            {i18n.gettext(`Tools for making the Web work harder for you`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="lastpass"
          linkTo="/addon/lastpass-password-manager/"
          styleName="Home-lastpass"
        >
          <h3>{i18n.gettext('LastPass Password Manager')}</h3>
          <p>
            {i18n.gettext(`Easily manage all your passwords for all devices
              from one spot`)}
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
