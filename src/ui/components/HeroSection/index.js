/* @flow */
import classNames from 'classnames';
import React from 'react';

import Link from 'amo/components/Link';

import './styles.scss';


type PropTypes = {|
  children?: any,
  linkTo?: Object | string,
  styleName: string,
|};

export default class HeroSection extends React.Component {
  static defaultProps = {
    styleName: 'default',
  }

  props: PropTypes;

  render() {
    const { children, linkTo, styleName } = this.props;

    return (
      <div
        className={classNames(
          'HeroSection',
          `HeroSection-styleName--${styleName}`,
        )}
      >
        {linkTo ? (
          <Link
            className="HeroSection-link-wrapper"
            to={linkTo}
          >
            <div className="HeroSection-content">
              {children}
            </div>
          </Link>
        ) : (
          <div className="HeroSection-wrapper">
            <div className="HeroSection-content">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }
}
