/* @flow */
import classNames from 'classnames';
import React from 'react';

import './styles.scss';


type LoadingTextProps = {
  className?: string,
  width?: number,
  minWidth: number,
  range: number,
}

export default class LoadingText extends React.Component {
  static defaultProps = {
    minWidth: 20,
    range: 60,
  }

  props: LoadingTextProps;

  render() {
    const { className, minWidth, range, width } = this.props;

    // We start each animation with a slightly different delay so content
    // doesn't appear to be pulsing all at once.
    const delayStart = Math.floor(Math.random() * 3) + 1;

    let finalWidth = width;
    if (typeof finalWidth === 'undefined') {
      // Allow a minimum width so placeholders appear approximately
      // the same size as content.
      finalWidth = Math.floor(Math.random() * range) + minWidth;
    }

    return (
      <span
        className={classNames(
          'LoadingText',
          `LoadingText--delay-${delayStart}`,
          className,
        )}
        style={{
          width: `${finalWidth}%`,
        }}
      />
    );
  }
}
