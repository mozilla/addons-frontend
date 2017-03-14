import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import './Button.scss';

export default class Button extends React.Component {
  static propTypes = {
    appearance: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
    href: PropTypes.string,
    size: PropTypes.string.isRequired,
  }

  static defaultProps = {
    appearance: 'undefined',
    size: 'normal',
  };

  render() {
    const { appearance, children, className, href, size, ...rest } = this.props;
    const props = {
      className: classNames('Button', className, {
        'Button--small': size === 'small',
        'Button--light' : appearance === 'appearance',
      }),
      ...rest,
    };

    if (href) {
      return <Link {...props} href={href}>{children}</Link>;
    }
    return <button {...props}>{children}</button>;
  }
}
