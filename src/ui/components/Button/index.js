import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import Link from 'amo/components/Link';


import './Button.scss';

export default class Button extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    href: PropTypes.string,
    to: PropTypes.string,
  }

  render() {
    const {
      children,
      className,
      href,
      to,
      ...rest
    } = this.props;
    const props = { className: classNames('Button', className), ...rest };

    if (href || to) {
      if (href) {
        props.href = href;
      } else if (to) {
        props.to = to;
      }

      return <Link {...props}>{children}</Link>;
    }

    return <button {...props}>{children}</button>;
  }
}
