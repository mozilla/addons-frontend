/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';

import Link from 'amo/components/Link';
import { addQueryParams } from 'core/utils';

import './styles.scss';

type Props = {|
  children?: any,
  linkTo?: Object | string,
  onClick?: () => void,
  styleName?: string,
  linkSource?: string,
|};

const createToLink = (url, linkSource) => {
  return {
    to: linkSource
      ? addQueryParams(url, {
          src: linkSource,
        })
      : url,
  };
};

export default class HeroSection extends React.Component<Props> {
  static defaultProps = {
    styleName: 'default',
  };

  render() {
    const { children, linkTo, linkSource, styleName } = this.props;

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
            {...createToLink(linkTo, linkSource)}
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
