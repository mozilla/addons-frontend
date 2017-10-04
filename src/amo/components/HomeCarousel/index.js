/* @flow */
import React from 'react';
import { compose } from 'redux';

import { ADDON_TYPE_EXTENSION } from 'core/constants';
import translate from 'core/i18n/translate';
import { visibleAddonType } from 'core/utils';
import Carousel from 'ui/components/Carousel';
import CarouselSection from 'ui/components/CarouselSection';

import './styles.scss';


type PropTypes = {|
  i18n: Object,
|};

export class HomeCarouselBase extends React.Component {
  props: PropTypes;

  carouselSections() {
    const { i18n } = this.props;

    return [
      (
        <CarouselSection
          key="featured-extensions"
          linkTo={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`}
          styleName="Home-featured-extensions"
        >
          <h3>{i18n.gettext('Featured extensions')}</h3>

          <p>{i18n.gettext('Excellent extensions for all situations')}</p>
        </CarouselSection>
      ),
      (
        <CarouselSection
          key="youtube-high-definition"
          linkTo="/addon/youtube-high-definition/"
          styleName="Home-youtube-high-definition"
        >
          <h3>{i18n.gettext('YouTube High Definition')}</h3>

          <p>
            {i18n.gettext(`Videos in HD, turn off annotations,
              change player size & more`)}
          </p>
        </CarouselSection>
      ),
      (
        <CarouselSection
          key="privacy-matters"
          linkTo="/collections/mozilla/privacy-matters/"
          styleName="Home-privacy-matters"
        >
          <p>
            {i18n.gettext(`From ad blockers to anti-trackers, here
              are some impressive privacy extensions`)}
          </p>
        </CarouselSection>
      ),
      (
        <CarouselSection
          key="ublock-origin"
          linkTo="/addon/ublock-origin/"
          styleName="Home-ublock-origin"
        >
          <h3>{i18n.gettext('uBlock Origin')}</h3>
          <p>
            {i18n.gettext(`An extremely powerful ad blocker that’s simple
              to use`)}
          </p>
        </CarouselSection>
      ),
    ];
  }

  render() {
    return (
      <div className="HomeCarousel">
        <Carousel sections={this.carouselSections()} />
      </div>
    );
  }
}

export default compose(
  translate(),
)(HomeCarouselBase);
