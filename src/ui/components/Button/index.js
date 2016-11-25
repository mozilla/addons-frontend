import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';

import './Button.scss';

export default class Button extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    href: PropTypes.string,
  }

  render() {
    const { children, className, href, ...rest } = this.props;
    const props = {
      className: classNames('Button', className),
      ...rest,
    };

    if (href) {
      return <Link {...props} href={href}>{children}</Link>;
    }
    return <button {...props}>{children}</button>;
  }
}
