/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setHeroBannerOrder } from 'amo/reducers/heroBanners';
import Card from 'amo/components/Card';
import HeroSection from 'amo/components/HeroSection';
import type { AppState } from 'amo/store';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

export type HeroSectionsType = Array<React.Element<typeof HeroSection>>;

type Props = {|
  name: string,
  random?: boolean,
  sections: HeroSectionsType,
|};

type InternalProps = {|
  ...Props,
  dispatch: DispatchFunc,
  heroBanners: Object,
|};

export class HeroBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { dispatch, heroBanners, name, random, sections } = props;

    if (!heroBanners[name]) {
      dispatch(setHeroBannerOrder({ name, random, sections }));
    }
  }

  render(): React.Node {
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

export const mapStateToProps = (state: AppState): {| heroBanners: any |} => {
  return { heroBanners: state.heroBanners };
};

const Hero: React.ComponentType<Props> = compose(connect(mapStateToProps))(
  HeroBase,
);

export default Hero;
