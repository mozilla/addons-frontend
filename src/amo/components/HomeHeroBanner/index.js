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
          linkTo="/addon/facebook-container/"
        >
          <h3>{i18n.gettext('Facebook Container')}</h3>

          <p>
            {i18n.gettext('Prevent Facebook from tracking you around the web')}
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
            {i18n.gettext('Fill out a lot of forms? This might help')}
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
          linkTo="/addon/tab_search/"
        >
          <h3>{i18n.gettext('TabSearch')}</h3>

          <p>
            {i18n.gettext('Need a search function for just your open tabs?')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-11"
          linkTo="/addon/the-laser-cat/"
        >
          <h3>{i18n.gettext('Laser Cat')}</h3>

          <p>
            {i18n.gettext(`For moments on the internet when you need to fire
              lasers out of a cat`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-12"
          linkTo="/addon/s3download-statusbar/"
        >
          <h3>{i18n.gettext('Download Manager (S3)')}</h3>

          <p>{i18n.gettext('Manage downloads from a tidy status bar')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-13"
          linkTo="/addon/black-menu-google/"
        >
          <h3>{i18n.gettext('Black Menu for Google')}</h3>

          <p>
            {i18n.gettext(`Easy drop-down menu access to Google services
              like Search and Translate`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-14"
          linkTo="/addon/honey/"
        >
          <h3>{i18n.gettext('Honey')}</h3>

          <p>{i18n.gettext('Automatically searches for coupon codes')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-15"
          linkTo="/addon/shine-reddit/"
        >
          <h3>{i18n.gettext('SHINE for Reddit')}</h3>

          <p>
            {i18n.gettext('Experience Reddit with alternative designs')}
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
      (
        <HeroSection
          key="hero-18"
          linkTo="/addon/foxy-gestures/"
        >
          <h3>{i18n.gettext('FoxyGestures')}</h3>

          <p>
            {i18n.gettext('Customized mouse gestures')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-19"
          linkTo="/addon/privacy-badger17/"
        >
          <h3>{i18n.gettext('PrivacyBadger')}</h3>

          <p>
            {i18n.gettext('Block sneaky spying ads and trackers')}
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
