import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './styles.scss';


export default class Icon extends React.Component {
  static propTypes = {
    alt: PropTypes.node,
    className: PropTypes.string,
    name: PropTypes.string.isRequired,
  }

  render() {
    const { alt, className, name, ...props } = this.props;

    // If alt text was included, we'll render that in a hidden span.
    if (alt) {
      props.children = <span className="visually-hidden">{alt}</span>;
    }

    return (
      <i className={classNames('Icon', `Icon-${name}`, className)} {...props} />
    );
  }
}
