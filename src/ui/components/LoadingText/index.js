/* @flow */
import classNames from 'classnames';
import React from 'react';

import './styles.scss';


type LoadingTextProps = {
  className?: string,
  fixedWidth?: number,
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
    const { className, fixedWidth, minWidth, range } = this.props;

    // We start each animation with a slightly different delay so content
    // doesn't appear to be pulsing all at once.
    const delayStart = Math.floor(Math.random() * 3) + 1;

    let width = fixedWidth;
    if (typeof width === 'undefined') {
      // Allow a minimum width so placeholders appear approximately
      // the same size as content.
      width = Math.floor(Math.random() * range) + minWidth;
    }

    return (
      <div
        className={classNames(
          'LoadingText',
          `LoadingText--delay-${delayStart}`,
          className,
        )}
        style={{
          width: `${width}%`,
        }}
      />
    );
  }
}
