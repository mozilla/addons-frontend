import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import Link from 'amo/components/Link';


import './Button.scss';

export default class Button extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    inverse: PropTypes.bool,
    to: PropTypes.string,
    size: PropTypes.string,
  }

  static defaultProps = {
    inverse: false,
    size: 'normal',
    type: 'neutral',
  };

  render() {
    const {
      children,
      className,
      href,
      inverse,
      to,
      size,
      type,
      ...rest,
    } = this.props;
    const props = {
      className: classNames('Button', className, [
        `Button--size-${size}`,
        `Button--type-${type}`,
      ], {
        'Button--inverse': inverse,
      }),
      ...rest,
    };

    if (href || to) {
      if (href) {
        props.href = href;
      } else if (to) {
        props.to = to;
      }

      return <Link {...props}>{children}</Link>
    }

    return <button {...props}>{children}</button>;
  }
}
