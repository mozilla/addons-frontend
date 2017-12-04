/* @flow */
import React from 'react';
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
          key="featured-extensions"
          linkTo="/addon/s3google-translator/"
          styleName="Home-s3-translator"
        >
          <h3>
            {i18n.gettext(
              // translators: This is the name of an add-on.
              'S3.Translator'
            )}
          </h3>

          <p>{i18n.gettext(`Translate a word, phrase, even an entire page.
            Supports 100+ languages.`)}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="featured-extensions"
          linkTo="/addon/groupspeeddial/"
          styleName="Home-groupspeeddial"
        >
          <h3>{i18n.gettext('Group Speed Dial')}</h3>

          <p>{i18n.gettext(`Visual bookmarks for your favorite places on the
            web.`)}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="featured-extensions"
          linkTo="/addon/search_by_image/"
          styleName="Home-search_by_image"
        >
          <h3>{i18n.gettext('Search by Image')}</h3>

          <p>
            {i18n.gettext('Reverse image search using various search engines.')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="featured-extensions"
          linkTo="/addon/fireshot/"
          styleName="Home-fireshot"
        >
          <h3>{i18n.gettext('FireShot')}</h3>

          <p>
            {i18n.gettext('Capture full-page screenshots.')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="featured-extensions"
          linkTo="/addon/video-downloadhelper/"
          styleName="Home-video-downloadhelper"
        >
          <h3>{i18n.gettext('Video DownloadHelper')}</h3>

          <p>{i18n.gettext(`Easily download video from hundreds of popular
            websites.`)}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="featured-extensions"
          linkTo="/addon/decentraleyes/"
          styleName="Home-decentraleyes"
        >
          <h3>{i18n.gettext('Decentraleyes')}</h3>

          <p>{i18n.gettext(`Tracking protection against third-party sites
            aiming to mark your every online move.`)}</p>
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
