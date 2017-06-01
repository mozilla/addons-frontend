/* @flow */
import classNames from 'classnames';
import React from 'react';

import './styles.scss';


type LoadingTextProps = {
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
    const { minWidth, range } = this.props;

    // We start each animation with a slightly different delay so content
    // doesn't appear to be pulsing all at once.
    const delayStart = Math.floor(Math.random() * 3) + 1;

    // Allow a minimum and maximum width so placeholders appear approximately
    // the same size as content.
    const width = Math.floor(Math.random() * range) + minWidth;

    return (
      <div
        className={classNames(
          'LoadingText',
          `LoadingText--delay-${delayStart}`,
        )}
        style={{
          width: `${width}%`,
        }}
      />
    );
  }
}
