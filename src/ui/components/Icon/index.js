import React, { PropTypes } from 'react';
import classNames from 'classnames';

import './styles.scss';

export default class Icon extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    getRef: PropTypes.func,
    name: PropTypes.string.isRequired,
  }

  render() {
    const { className, name, getRef, ...props } = this.props;
    if (getRef) {
      props.ref = getRef;
    }
    return <i className={classNames('Icon', `Icon-${name}`, className)} {...props} />;
  }
}
