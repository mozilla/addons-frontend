/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import { getHeroItems } from 'amo/homeHeroItems';
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

    const heroes = getHeroItems(i18n);

    return heroes.map((hero) => {
      const { description, title } = hero;
      return (
        <HeroSection key={`hero-${hero.url}`} linkTo={hero.url}>
          <h3>{title}</h3>
          <p>{description}</p>
        </HeroSection>
      );
    });
  }

  render() {
    return (
      <div className="HomeHeroBanner">
        <Hero name="Home" random sections={this.sections()} />
      </div>
    );
  }
}

const HomeHeroBanner: React.ComponentType<Props> = compose(translate())(
  HomeHeroBannerBase,
);

export default HomeHeroBanner;
