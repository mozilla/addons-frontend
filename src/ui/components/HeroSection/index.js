/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import Link from 'amo/components/Link';
import { INSTALL_SOURCE_HERO_PROMO } from 'core/constants';
import { addQueryParams } from 'core/utils';

import './styles.scss';

type Props = {|
  children?: any,
  linkTo?: Object | string,
  onClick?: () => void,
  styleName?: string,
|};

export default class HeroSection extends React.Component<Props> {
  static defaultProps = {
    styleName: 'default',
  };

  render() {
    const { children, linkTo, styleName } = this.props;

    return (
      <div
        className={makeClassName(
          'HeroSection',
          `HeroSection-styleName--${String(styleName)}`,
        )}
      >
        {linkTo ? (
          <Link
            className="HeroSection-link-wrapper"
            onClick={this.props.onClick}
            to={addQueryParams(linkTo, { src: INSTALL_SOURCE_HERO_PROMO })}
          >
            <div className="HeroSection-content">{children}</div>
          </Link>
        ) : (
          <div className="HeroSection-wrapper">
            <div className="HeroSection-content">{children}</div>
          </div>
        )}
      </div>
    );
  }
}
