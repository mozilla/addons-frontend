/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import Hero from 'ui/components/Hero';
import type { I18nType } from 'core/types/i18n';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';

import './styles.scss';

type InternalProps = {|
  i18n: I18nType,
|};

export class HomeHeroBase extends React.Component<InternalProps> {
  getHeroes() {
    const { i18n } = this.props;

    // TODO: get urls
    return [
      {
        title: i18n.gettext('Stay Safe Online'),
        icon: 'stop-hand',
        url: '/guides/stay-safe',
      },
      {
        title: i18n.gettext('Organize Your Tabs'),
        icon: 'browser',
        url: '/guides/organize-your-tabs',
      },
      {
        title: i18n.gettext('Elevate Your Media Experience'),
        icon: 'video',
        url: '/guides/elevate-your-media',
      },
    ];
  }

  getHeaderSection() {
    const { i18n } = this.props;

    return (
      <div className="HomeHero-header">
        <h2 className="HomeHero-title">
          {i18n.gettext('Extensions are like apps for your browsers.')}
        </h2>
        <h3 className="HomeHero-subtitle">
          {i18n.gettext(
            'They add features to Firefox to make browsing faster, smarter, or just plain fun.',
          )}
        </h3>
      </div>
    );
  }

  getSections() {
    return this.getHeroes().map((hero) => {
      const { title, icon, url } = hero;

      return (
        <Link key={url} to={url} className="HomeHero-link">
          <Card className="HomeHero-card">
            <Icon className="HomeHero-icon" name={icon} />
            <h4>
              <span>{title}</span>
            </h4>
          </Card>
        </Link>
      );
    });
  }

  render() {
    return (
      <div className="HomeHero">
        {this.getHeaderSection()}

        <div className="HomeHero-cards">
          <Hero name="Home" sections={this.getSections()} />
        </div>
      </div>
    );
  }
}

const HomeHero: React.ComponentType<InternalProps> = compose(translate())(
  HomeHeroBase,
);

export default HomeHero;
