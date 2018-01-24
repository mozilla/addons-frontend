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
          key="wikipedia-context-menu-search"
          linkTo="/addon/wikipedia-context-menu-search/"
        >
          <h3>{i18n.gettext('Wikipedia Context Menu Search')}</h3>

          <p>
            {i18n.gettext('Highlight any text and search Wikipedia.')}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="momentumdash"
          linkTo="/addon/momentumdash/"
        >
          <h3>{i18n.gettext('Momentum')}</h3>

          <p>
            {i18n.gettext(`Replace your new tab with a personal
              dashboard—to-do lists, weather forecasts and more.`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="undo-close-tab-button"
          linkTo="/addon/undo-close-tab-button/"
        >
          <h3>{i18n.gettext('Undo Close Tab Button')}</h3>

          <p>{i18n.gettext('Never lose a page again.')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="grammarly"
          linkTo="/addon/grammarly-1/"
        >
          <h3>{i18n.gettext('Grammarly')}</h3>
          <p>
            {i18n.gettext(`Get grammar help anywhere you write on the
              web—social media, email, docs and more.`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="facebook-filter"
          linkTo="/addon/facebook-filter/"
        >
          <h3>{i18n.gettext('Facebook Filter')}</h3>
          <p>
            {i18n.gettext(`Remove ads, promoted content, and other clutter
              from your feed.`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="gesturefy"
          linkTo="/addon/gesturefy/"
        >
          <h3>{i18n.gettext('Gesturefy')}</h3>

          <p>{i18n.gettext('40+ customizable mouse gestures.')}</p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="lastpass"
          linkTo="/addon/lastpass-password-manager/"
        >
          <h3>{i18n.gettext('LastPass Password Manager')}</h3>

          <p>
            {i18n.gettext(`Easily manage all your passwords for all devices
              from one spot`)}
          </p>
        </HeroSection>
      ),
      (
        <HeroSection
          key="multi-account-containers"
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
          key="tree-style-tab"
          linkTo="/addon/tree-style-tab/"
        >
          <h3>{i18n.gettext('Tree Style Tab')}</h3>

          <p>{i18n.gettext('Display tabs in a space-saving “tree” layout.')}</p>
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
