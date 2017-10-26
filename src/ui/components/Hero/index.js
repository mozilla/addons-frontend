/* @flow */
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setHeroBannerOrder } from 'core/reducers/heroBanners';
import Card from 'ui/components/Card';
import HeroSection from 'ui/components/HeroSection';

import './styles.scss';


type Props = {|
  dispatch: Function,
  heroBanners: Object,
  name: string,
  random?: boolean,
  sections: Array<HeroSection>,
|};

export class HeroBase extends React.Component<Props> {
  componentWillMount() {
    const {
      dispatch,
      heroBanners,
      name,
      random,
      sections,
    } = this.props;

    if (!heroBanners[name]) {
      dispatch(setHeroBannerOrder({ name, random, sections }));
    }
  }

  render() {
    const { heroBanners, name, sections } = this.props;
    const orderStyle = heroBanners[name] ?
      `Hero-order-${heroBanners[name].order.join('-')}` : null;

    return (
      <Card className={classNames('Hero', `Hero-name-${name}`, orderStyle)}>
        <div className="Hero-contents">
          {heroBanners[name] ? heroBanners[name].order.map((index) => {
            return sections[index];
          }) : null}
        </div>
      </Card>
    );
  }
}

export const mapStateToProps = (state: Object) => {
  return { heroBanners: state.heroBanners };
};

export default compose(
  connect(mapStateToProps),
)(HeroBase);
