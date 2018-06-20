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
          linkTo="/addon/swift-selection-search/"
        >
          <h3>{i18n.gettext('Swift Selection Search')}</h3>

          <p>
            {i18n.gettext(`Highlight text on any web page to pull up a
              handy search menu`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-3"
          linkTo="/addon/turbo-download-manager/"
        >
          <h3>{i18n.gettext('Turbo Download Manager')}</h3>

          <p>
            {i18n.gettext(`Increase download speeds with multi-threading
              support`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-4"
          linkTo="/addon/web-security/"
        >
          <h3>{i18n.gettext('Web Security')}</h3>
          <p>
            {i18n.gettext('Protection against malware and data phishing scams')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-5"
          linkTo="/addon/vertical-tabs-reloaded/"
        >
          <h3>{i18n.gettext('Vertical Tabs Reloaded')}</h3>
          <p>
            {i18n.gettext('Arrange tabs in a vertical fashion')}
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
          linkTo="/addon/worldwide-radio/"
        >
          <h3>{i18n.gettext('Worldwide Radio')}</h3>

          <p>
            {i18n.gettext(`Quantum Extensions Challenge winner!
              Listen to live radio from around the world`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-10"
          linkTo="/addon/tabliss/"
        >
          <h3>{i18n.gettext('Tabliss')}</h3>

          <p>
            {i18n.gettext(`Enjoy a gorgeous new tab page with customizable
              backgrounds, local weather & more`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-11"
          linkTo="/addon/share-backported/"
        >
          <h3>{i18n.gettext('Share Backported')}</h3>

          <p>
            {i18n.gettext(`Put a social media ‘Share’ button into Firefox
              toolbar`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-12"
          linkTo="/addon/view-page-archive/"
        >
          <h3>{i18n.gettext('View Page Archive & Cache')}</h3>

          <p>
            {i18n.gettext(`A powerful way to find archived versions of older
              web pages`)}
          </p>
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
          linkTo="/addon/page-translate/"
        >
          <h3>{i18n.gettext('Page Translate')}</h3>

          <p>
            {i18n.gettext('Translate an entire web page with a couple clicks')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-15"
          linkTo="/addon/image-search-options/"
        >
          <h3>{i18n.gettext('Image Search Options')}</h3>

          <p>
            {i18n.gettext('Access reverse image search options in a context menu')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-16"
          linkTo="/addon/forget_me_not/"
        >
          <h3>{i18n.gettext('Forget Me Not')}</h3>

          <p>
            {i18n.gettext(`Make Firefox forget website data like cookies
              & local storage`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-17"
          linkTo="/addon/groupspeeddial/"
        >
          <h3>{i18n.gettext('Group Speed Dial')}</h3>

          <p>
            {i18n.gettext(`Visual bookmarks for your favorite places on the
              web`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="hero-18"
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

const HomeHeroBanner: React.ComponentType<Props> = compose(
  translate(),
)(HomeHeroBannerBase);

export default HomeHeroBanner;
