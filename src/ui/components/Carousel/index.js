/* @flow */
import classNames from 'classnames';
import deepEqual from 'deep-eql';
import React from 'react';
import { compose } from 'redux';
import NukaCarousel from 'nuka-carousel';

import log from 'core/logger';
import translate from 'core/i18n/translate';
import { getDirection } from 'core/i18n/utils';
import { randomizeArray } from 'core/utils';
import Card from 'ui/components/Card';
import CarouselSection from 'ui/components/CarouselSection';

import './styles.scss';


type PropTypes = {|
  i18n: Object,
  // This is a bug; random is used in `storeSortedSections()`.
  // eslint-disable-next-line react/no-unused-prop-types
  random: boolean,
  // eslint-disable-next-line react/no-unused-prop-types
  sections: Array<React.Element<typeof CarouselSection>>,
|};

type StateTypes = {|
  hasRendered: boolean,
  sectionsSorted: Array<React.Element<typeof CarouselSection>> | null,
|};

export class CarouselBase extends React.Component {
  static defaultProps = {
    random: false,
  }

  constructor(props: PropTypes) {
    super(props);

    this.state = {
      hasRendered: false,
      sectionsSorted: null,
    };
  }

  state: StateTypes;

  componentWillMount() {
    this.storeSortedSections(this.props);
  }

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

  componentWillReceiveProps(nextProps: PropTypes) {
    if (!deepEqual(this.props, nextProps)) {
      this.storeSortedSections(nextProps);
    }
  }

  storeSortedSections(props: PropTypes) {
    const { random, sections } = props;

    if (!sections) {
      throw new Error('sections are required for a Carousel component');
    }

    // We store the sections sorted in state so the randomized order doesn't
    // change when we re-render on the server, which causes a visual bug.
    this.setState({
      sectionsSorted: random ? randomizeArray(sections) : sections,
    });
  }

  props: PropTypes;

  render() {
    const { i18n } = this.props;
    const { hasRendered, sectionsSorted } = this.state;

    if (!sectionsSorted) {
      return null;
    }

    return (
      <Card
        className={classNames('Carousel', {
          'Carousel--first-render-wrapper': !this.state.hasRendered,
        })}
      >
        {hasRendered ? (
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
            {(sectionsSorted.map((section) => {
              return section;
            }))}
          </NukaCarousel>
        ) : (
          <div className="Carousel--first-render">
            {/*
              We render the sections here to keep the server-side content
              similar to the client-side content so the re-render isn't as
              jarring–and so non-JS clients can still see the carousel.
            */}
            {(sectionsSorted.map((section) => {
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
