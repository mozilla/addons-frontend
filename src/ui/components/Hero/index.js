/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setHeroBannerOrder } from 'core/reducers/heroBanners';
import Card from 'ui/components/Card';
import HeroSection from 'ui/components/HeroSection';
import type { DispatchFunc } from 'core/types/redux';

import './styles.scss';

type Props = {|
  name: string,
  random?: boolean,
  sections: Array<React.Element<typeof HeroSection>>,
|};

type InternalProps = {|
  ...Props,
  dispatch: DispatchFunc,
  heroBanners: Object,
|};

export class HeroBase extends React.Component<InternalProps> {
  componentWillMount() {
    const { dispatch, heroBanners, name, random, sections } = this.props;

    if (!heroBanners[name]) {
      dispatch(setHeroBannerOrder({ name, random, sections }));
    }
  }

  render() {
    const { heroBanners, name, sections } = this.props;
    const orderStyle = heroBanners[name]
      ? `Hero-order-${heroBanners[name].order.join('-')}`
      : null;

    return (
      <Card className={makeClassName('Hero', `Hero-name-${name}`, orderStyle)}>
        <div className="Hero-contents">
          {heroBanners[name]
            ? heroBanners[name].order.map((index) => {
                return sections[index];
              })
            : null}
        </div>
      </Card>
    );
  }
}

export const mapStateToProps = (state: Object) => {
  return { heroBanners: state.heroBanners };
};

const Hero: React.ComponentType<Props> = compose(connect(mapStateToProps))(
  HeroBase,
);

export default Hero;
