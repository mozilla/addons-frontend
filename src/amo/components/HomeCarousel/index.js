/* @flow */
import React from 'react';
import { compose } from 'redux';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
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

  render() {
    const { i18n } = this.props;

    return (
      <div className="HomeCarousel">
        <Carousel
          sections={[
            (
              <CarouselSection
                key="featured-extensions"
                linkTo={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`}
                styleName="Home-featured-extensions"
              >
                {i18n.gettext('Featured extensions')}
              </CarouselSection>
            ),
            (
              <CarouselSection
                key="featured-extensions"
                linkTo="/collections/mozilla/dynamic-media-downloaders/"
                styleName="Home-dynamic-media-downloaders"
              >
                {i18n.gettext('There are better ways to download media')}
              </CarouselSection>
            ),
            (
              <CarouselSection
                key="featured-extensions"
                linkTo="/collections/mozilla/privacy-matters/"
                styleName="Home-privacy-matters"
              >
                {i18n.gettext(`From ad blockers to anti-trackers, here are some
                  impressive privacy extensions`)}
              </CarouselSection>
            ),
            (
              <CarouselSection
                key="featured-extensions"
                linkTo={{
                  pathname: '/search/',
                  query: {
                    addonType: ADDON_TYPE_THEME,
                    sort: SEARCH_SORT_TOP_RATED,
                  },
                }}
                styleName="Home-top-rated-themes"
              >
                {i18n.gettext('Top-rated themes')}
              </CarouselSection>
            ),
          ]}
        />
      </div>
    );
  }
}

export default compose(
  translate(),
)(HomeCarouselBase);
