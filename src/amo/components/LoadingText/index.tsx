import makeClassName from 'classnames';
import * as React from 'react';
import './styles.scss';

type DefaultProps = {
  minWidth: number;
};
type Props = DefaultProps & {
  className?: string;
  width?: number;
};
const possibleWidths = [20, 40, 60, 80, 100];
export default class LoadingText extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    minWidth: 20,
  };

  render(): React.ReactNode {
    const {
      className,
      minWidth,
      width,
    } = this.props;
    // We start each animation with a slightly different delay so content
    // doesn't appear to be pulsing all at once.
    const delayStart = Math.floor(Math.random() * 3) + 1;
    let finalWidth = width;

    if (typeof finalWidth === 'undefined' || !possibleWidths.includes(finalWidth)) {
      const widths = possibleWidths.filter((w) => w >= minWidth);
      finalWidth = widths[Math.floor(Math.random() * widths.length)];
    }

    return <span className={makeClassName('LoadingText', `LoadingText--delay-${delayStart}`, `LoadingText--width-${finalWidth}`, className)} role="alert" aria-busy="true" />;
  }

}