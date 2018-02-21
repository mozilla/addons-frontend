/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Hero from 'ui/components/Hero';
import HeroSection from 'ui/components/HeroSection';
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
          key="hero-1"
          linkTo="/addon/temporary-containers/"
        >
          <h3>{i18n.gettext('Temporary Containers')}</h3>

          <p>
            {i18n.gettext('Open pages with disposable data containers')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-2"
          linkTo="/addon/momentumdash/"
        >
          <h3>{i18n.gettext('Momentum')}</h3>

          <p>
            {i18n.gettext(`Replace your new tab with a personal
              dashboard—to-do lists, weather forecasts and more`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-3"
          linkTo="/addon/kimetrak/"
        >
          <h3>{i18n.gettext('Kimetrak')}</h3>

          <p>{i18n.gettext('Track who’s tracking you')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-4"
          linkTo="/addon/mailvelope/"
        >
          <h3>{i18n.gettext('Mailvelope')}</h3>
          <p>
            {i18n.gettext('Secure encryption for webmail')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-5"
          linkTo="/addon/翻译侠-translate-man/"
        >
          <h3>{i18n.gettext('Translate Man')}</h3>
          <p>
            {i18n.gettext('Point-and-click instant translations')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-6"
          linkTo="/addon/ublock-origin/"
        >
          <h3>{i18n.gettext('uBlock Origin')}</h3>

          <p>{i18n.gettext('Efficient, powerful ad blocker')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-7"
          linkTo="/addon/ghostery/"
        >
          <h3>{i18n.gettext('Ghostery')}</h3>

          <p>
            {i18n.gettext(`Popular anti-tracking extension now has
              ad blocking ability`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-8"
          linkTo="/addon/multi-account-containers/"
        >
          <h3>{i18n.gettext('Multi-Account Containers')}</h3>

          <p>
            {i18n.gettext(`Keep different parts of your online
              life—work, personal, etc.—separated by color-coded tabs`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-9"
          linkTo="/addon/searchpreview/"
        >
          <h3>{i18n.gettext('SearchPreview')}</h3>

          <p>
            {i18n.gettext(`Enhance search results with thumbnail previews,
              popularity ranks & more`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-10"
          linkTo="/addon/forget_me_not/"
        >
          <h3>{i18n.gettext('Forget Me Not')}</h3>

          <p>
            {i18n.gettext(`Automatically delete data (cookies, local storage,
              etc.) on all sites you visit except those on your whitelist`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-11"
          linkTo="/addon/zoom/"
        >
          <h3>{i18n.gettext('Zoom for Firefox')}</h3>

          <p>
            {i18n.gettext(`Simple zoom in/out tool for a close-up view of any
              web content`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-12"
          linkTo="/addon/wikiwand-wikipedia-modernized/"
        >
          <h3>{i18n.gettext('Wikiwand')}</h3>

          <p>{i18n.gettext('Give Wikipedia a gorgeous makeover')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-13"
          linkTo="/addon/onetab/"
        >
          <h3>{i18n.gettext('OneTab')}</h3>

          <p>
            {i18n.gettext(`Convert your open tabs into a list and save
              precious memory space`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-14"
          linkTo="/addon/kindle-it/"
        >
          <h3>{i18n.gettext('Push to Kindle')}</h3>

          <p>{i18n.gettext('Send any Web page to your Kindle device')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-15"
          linkTo="/addon/search-site-we/"
        >
          <h3>{i18n.gettext('Search Site')}</h3>

          <p>
            {i18n.gettext('Search within just the domain you’re visiting')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-16"
          linkTo="/addon/youtube-dark-purple/"
        >
          <h3>{i18n.gettext('Dark Purple YouTube Theme')}</h3>

          <p>
            {i18n.gettext('Enjoy YouTube with a different look')}
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
