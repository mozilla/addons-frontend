/* @flow */
import React from 'react';
import NukaCarousel from 'nuka-carousel';

import Card from 'ui/components/Card';

import './styles.scss';


type PropTypes = {|
  sections: Array<any>,
|};

const Carousel = ({ sections }: PropTypes) => {
  if (!sections) {
    throw new Error('sections are required for a Carousel component');
  }

  return (
    <Card className="Carousel">
      <NukaCarousel
        autoplay={false}
        autoplayInterval={4000}
        cellAlign="left"
        cellSpacing={10}
        framePadding="0 10%"
        frameOverflow="visible"
        slidesToShow={1}
        slidesToScroll={1}
        slideWidth={1}
      >
        {(sections.map((section, i) => {
          // We have to wrap this content in a <div> or ReactSlick
          // won't apply the right properties to it.
          /* eslint-disable react/no-array-index-key */
          return (
            <div className="Carousel-section-wrapper" key={`carousel-${i}`}>
              {section}
            </div>
          );
          /* eslint-enable react/no-array-index-key */
        }))}
      </NukaCarousel>
    </Card>
  );
};

export default Carousel;
