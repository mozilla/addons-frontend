import classNames from 'classnames';
import React, { PropTypes } from 'react';

import Link from 'amo/components/Link';


import './Button.scss';

export default class Button extends React.Component {
  static propTypes = {
    appearance: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
    to: PropTypes.string,
    size: PropTypes.string.isRequired,
  }

  static defaultProps = {
    appearance: undefined,
    size: 'normal',
  };

  render() {
    const { appearance, children, className, to, size, ...rest } = this.props;
    const props = {
      className: classNames('Button', className, {
        'Button--small': size === 'small',
        'Button--light': appearance === 'light',
      }),
      ...rest,
    };

    if (to) {
      return <Link {...props} to={to}>{children}</Link>;
    }
    return <button {...props}>{children}</button>;
  }
}
