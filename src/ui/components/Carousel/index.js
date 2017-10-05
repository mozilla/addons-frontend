/* @flow */
import React from 'react';
import { compose } from 'redux';
import NukaCarousel from 'nuka-carousel';

import log from 'core/logger';
import translate from 'core/i18n/translate';
import { getDirection } from 'core/i18n/utils';
import Card from 'ui/components/Card';
import CarouselSection from 'ui/components/CarouselSection';

import './styles.scss';


type PropTypes = {|
  i18n: Object,
  sections: Array<React.Element<typeof CarouselSection>>,
|};

type StateTypes = {|
  hasRendered: boolean,
|};

export class CarouselBase extends React.Component {
  constructor(props: PropTypes) {
    super(props);

    this.state = { hasRendered: false };
  }

  state: StateTypes;

  // HACK: NukaCarousel uses inline styles to create the carousel effect, which
  // work fine on the client but cause CSP issues during initial server render.
  // To get around this, we re-render the component on the client side.
  // We use componentDidMount to cause it to update on the client because this
  // lifecycle method is only called on the client.
  // See: https://github.com/mozilla/addons-frontend/issues/3349
  componentDidMount() {
    if (!this.state.hasRendered) {
      log.debug('Re-rendering Carousel to avoid CSP issues.');
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({ hasRendered: true });
    }
  }

  props: PropTypes;

  render() {
    const { i18n, sections } = this.props;

    if (!sections) {
      throw new Error('sections are required for a Carousel component');
    }

    return (
      <Card className="Carousel">
        {this.state.hasRendered ? (
          <NukaCarousel
            autoplay
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
        ) : (
          <div className="Carousel--server-render">
            {/*
              We render the sections here to keep the server-side content
              similar to the client-side content so the re-render isn't as
              jarring–and so non-JS clients can still see the carousel.
            */}
            {(sections.map((section) => {
              return section;
            }))}
          </div>
        )}
      </Card>
    );
  }
}

export default compose(
  translate(),
)(CarouselBase);
