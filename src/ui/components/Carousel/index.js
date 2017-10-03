/* @flow */
import React from 'react';
import ReactSlick from 'react-slick';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import { getDirection } from 'core/i18n/utils';
import Card from 'ui/components/Card';

// These are included in the repo via `react-slick`.
// eslint-disable-next-line import/no-extraneous-dependencies
import 'slick-carousel/slick/slick.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'slick-carousel/slick/slick-theme.css';
import './styles.scss';


type PropTypes = {|
  i18n: Object,
  sections: Array<any>,
|};

export class CarouselBase extends React.Component {
  props: PropTypes;

  render() {
    const { i18n, sections } = this.props;

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
          rtl={getDirection(i18n.lang) === 'rtl'}
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

export default compose(
  translate(),
)(CarouselBase);
