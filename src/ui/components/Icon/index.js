/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';

import './styles.scss';


export type Props = {|
  alt?: string | React.Node,
  className?: string,
  name: string,
|};

export default class Icon extends React.Component<Props> {
  render() {
    const { alt, className, name, ...props } = this.props;

    let children = null;
    // If alt text was included, we'll render that in a hidden span.
    if (alt) {
      children = <span className="visually-hidden">{alt}</span>;
    }

    return (
      <span className={makeClassName('Icon', `Icon-${name}`, className)} {...props}>
        {children}
      </span>
    );
  }
}
