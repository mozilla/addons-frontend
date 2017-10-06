import React from 'react';
import classNames from 'classnames';

import './styles.scss';


export type Props = {|
  // TODO: use React.Node when we use Flow 0.53+
  alt?: React.Element<*>,
  className?: string,
  name: string,
|};

export default class Icon extends React.Component {
  props: Props;

  render() {
    const { alt, className, name, ...props } = this.props;

    // If alt text was included, we'll render that in a hidden span.
    if (alt) {
      props.children = <span className="visually-hidden">{alt}</span>;
    }

    return (
      <span className={classNames('Icon', `Icon-${name}`, className)} {...props} />
    );
  }
}
