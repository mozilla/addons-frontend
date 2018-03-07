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
          linkTo="/addon/facebook-video-downloader-hd/"
        >
          <h3>{i18n.gettext('Facebook Video Downloader')}</h3>

          <p>
            {i18n.gettext('Download with a single click')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-2"
          linkTo="/addon/autoformer/"
        >
          <h3>{i18n.gettext('AutoFormer+')}</h3>

          <p>
            {i18n.gettext(`Fill out a lot of forms? This might help`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-3"
          linkTo="/addon/myki-password-manager/"
        >
          <h3>{i18n.gettext('Myki Password Manager & Authenticator')}</h3>

          <p>{i18n.gettext('Cutting edge security')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-4"
          linkTo="/addon/notebook_web_clipper/"
        >
          <h3>{i18n.gettext('Notebook Web Clipper')}</h3>
          <p>
            {i18n.gettext(`Clip, save & organize your favorite stuff
              on the web`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-5"
          linkTo="/addon/flagfox/"
        >
          <h3>{i18n.gettext('Flagfox')}</h3>
          <p>
            {i18n.gettext(`Displays a website’s server location by country
              flag`)}
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
          linkTo="/addon/ali-tools/"
        >
          <h3>{i18n.gettext('AliTools')}</h3>

          <p>
            {i18n.gettext('Online shopping assistance')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-10"
          linkTo="/addon/snake-game/"
        >
          <h3>{i18n.gettext('Snake Game')}</h3>

          <p>
            {i18n.gettext('The classic game, always a click away')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-11"
          linkTo="/addon/tab-invaders/"
        >
          <h3>{i18n.gettext('Tab Invaders')}</h3>

          <p>
            {i18n.gettext('Space Invaders meets smart tab management')}
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
              precious memory`)}
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
          linkTo="/addon/leechblock-ng/"
        >
          <h3>{i18n.gettext('LeechBlock NG')}</h3>

          <p>
            {i18n.gettext('Block time-wasting sites')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-17"
          linkTo="/addon/tranquility-1/"
        >
          <h3>{i18n.gettext('Tranquility Reader')}</h3>

          <p>
            {i18n.gettext('Remove clutter and improve readability')}
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
