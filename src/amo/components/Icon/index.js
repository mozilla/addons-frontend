/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import './styles.scss';

export type Props = {|
  alt?: string | React.Node,
  children?: React.Node,
  className?: string,
  name: string,
|};

export default class Icon extends React.Component<Props> {
  render(): React.Node {
    const { alt, children, className, name, ...props } = this.props;

    let altSpan;
    // If alt text was included, we'll render that in a hidden span.
    if (alt) {
      altSpan = <span className="visually-hidden">{alt}</span>;
    }

    return (
      <span
        className={makeClassName('Icon', `Icon-${name}`, className)}
        {...props}
      >
        {altSpan}
        {children}
      </span>
    );
  }
}
