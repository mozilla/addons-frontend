/* @flow */
import React from 'react';
import ReactSlick from 'react-slick';

import Card from 'ui/components/Card';

// These are included in the repo via `react-slick`.
// eslint-disable-next-line import/no-extraneous-dependencies
import 'slick-carousel/slick/slick.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'slick-carousel/slick/slick-theme.css';
import './styles.scss';


type PropTypes = {|
  sections: Array<any>,
|};

export default class Carousel extends React.Component {
  props: PropTypes;

  render() {
    const { sections } = this.props;

    if (!sections) {
      throw new Error('sections are required for a Carousel component');
    }

    return (
      <Card className="Carousel">
        <ReactSlick
          autoplay
          autoplaySpeed={5000}
          centerMode
          infinite={false}
          slidesToScroll={1}
          slidesToShow={3}
          variableWidth
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
        </ReactSlick>
      </Card>
    );
  }
}
