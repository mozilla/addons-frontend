/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import Hero from 'ui/components/Hero';
import HeroSection from 'ui/components/HeroSection';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {||};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class HomeHeroGuidesBase extends React.PureComponent<InternalProps> {
  getHeroes() {
    const { i18n } = this.props;

    // TODO: Get finalized guide urls.
    // See https://github.com/mozilla/addons-frontend/issues/6751.
    return [
      {
        title: i18n.gettext('Stay Safe Online'),
        icon: 'stop-hand',
        url: '/guides/stay-safe-online/',
      },
      {
        title: i18n.gettext('Organize Your Tabs'),
        icon: 'browser',
        url: '/guides/organize-your-tabs/',
      },
      {
        title: i18n.gettext('Enhance Your Media Experience'),
        icon: 'video',
        url: '/guides/enhance-your-media-experience/',
      },
    ];
  }

  getHeroHeader() {
    const { i18n } = this.props;

    return (
      <div className="HomeHeroGuides-header">
        <h2 className="HomeHeroGuides-header-title">
          {i18n.gettext('Extensions are like apps for your browsers.')}
        </h2>
        <h3 className="HomeHeroGuides-header-subtitle">
          {i18n.gettext(
            'They add features to Firefox to make browsing faster, smarter, or just plain fun.',
          )}
        </h3>
      </div>
    );
  }

  getHeroSections() {
    return this.getHeroes().map((hero) => {
      const { title, icon, url } = hero;

      return (
        <HeroSection key={url} linkTo={url}>
          <Card className="HomeHeroGuides-section">
            <Icon className="HomeHeroGuides-section-icon" name={icon} />
            <h4 className="HomeHeroGuides-section-title">{title}</h4>
          </Card>
        </HeroSection>
      );
    });
  }

  render() {
    return (
      <div className="HomeHeroGuides">
        {this.getHeroHeader()}

        <div className="HomeHeroGuides-sections">
          <Hero name="HomeHeroGuides" sections={this.getHeroSections()} />
        </div>
      </div>
    );
  }
}

const HomeHeroGuides: React.ComponentType<Props> = compose(translate())(
  HomeHeroGuidesBase,
);

export default HomeHeroGuides;
