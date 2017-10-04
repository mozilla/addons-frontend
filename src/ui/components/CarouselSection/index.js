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

export default class CarouselSection extends React.Component {
  static defaultProps = {
    styleName: 'default',
  }

  props: PropTypes;

  render() {
    const { children, linkTo, styleName } = this.props;

    return (
      <div
        className={classNames(
          'CarouselSection',
          `CarouselSection-styleName--${styleName}`,
        )}
      >
        {linkTo ? (
          <Link
            className="CarouselSection-link-wrapper"
            to={linkTo}
          >
            {children}
          </Link>
        ) : (
          <div className="CarouselSection-wrapper">{children}</div>
        )}
      </div>
    );
  }
}
