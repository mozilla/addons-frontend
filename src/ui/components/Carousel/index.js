/* @flow */
import NukaCarousel from 'nuka-carousel';
import React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { getDirection } from 'core/i18n/utils';
import Card from 'ui/components/Card';

import './styles.scss';


type PropTypes = {|
  i18n: Object,
  sections: Array<React$Element<*>>,
|};

const CarouselBase = ({ i18n, sections }: PropTypes) => {
  if (!sections) {
    throw new Error('sections are required for a Carousel component');
  }

  return (
    <Card className="Carousel">
      <NukaCarousel
        autoplay={false}
        autoplayInterval={4000}
        cellAlign={getDirection(i18n.lang) === 'ltr' ? 'left' : 'right'}
        cellSpacing={10}
        framePadding="0 10%"
        frameOverflow="visible"
        slidesToShow={1}
        slidesToScroll={1}
        slideWidth={1}
      >
        {(sections.map((section) => {
          return section;
        }))}
      </NukaCarousel>
    </Card>
  );
};

export default compose(
  translate(),
)(CarouselBase);
