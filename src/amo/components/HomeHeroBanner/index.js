/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import { heroes } from 'amo/homeHeroItems';
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

    return heroes.map((hero, index) => {
      const { description, title } = hero;
      return (
        /* eslint-disable react/no-array-index-key */
        <HeroSection key={`hero-${index}`} linkTo={hero.url}>
          <h3>{i18n.sprintf(i18n.gettext('%(title)s'), { title })}</h3>
          <p>
            {i18n.sprintf(i18n.gettext('%(description)s'), { description })}
          </p>
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
