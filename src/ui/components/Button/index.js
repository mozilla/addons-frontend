import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import PropTypes from 'prop-types';

import Link from 'amo/components/Link';
import log from 'core/logger';

import './styles.scss';

const BUTTON_TYPES = [
  'neutral',
  'light',
  'action',
  'cancel',
  'confirm',
  'alert',
  'none',
];

export default class Button extends React.Component {
  static propTypes = {
    buttonType: PropTypes.string,
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    href: PropTypes.string,
    micro: PropTypes.bool,
    noLink: PropTypes.bool,
    puffy: PropTypes.bool,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  };

  static defaultProps = {
    buttonType: 'none',
    disabled: false,
    micro: false,
    noLink: false,
    puffy: false,
  };

  render() {
    const {
      buttonType,
      children,
      className,
      href,
      micro,
      puffy,
      noLink,
      to,
      ...rest
    } = this.props;
    const props = { ...rest };

    if (!BUTTON_TYPES.includes(buttonType)) {
      throw new Error(oneLine`buttonType="${buttonType}" supplied but that is
        not a valid button type`);
    }

    const getClassName = (...classConfig) => {
      return makeClassName(
        'Button',
        `Button--${buttonType}`,
        className,
        ...classConfig,
        {
          'Button--disabled': props.disabled,
          'Button--micro': micro,
          'Button--puffy': puffy,
        },
      );
    };

    if (noLink) {
      return <span className={getClassName()}>{children}</span>;
    }

    if (href || to) {
      if (href) {
        props.href = href;
        // If this button should be a link we don't want to prefix the URL.
        props.prependClientApp = false;
        props.prependLang = false;
      } else if (to) {
        props.to = to;
      }

      // Only a Link needs a disabled css class. This is because button
      // is styled based on its disabled property.
      props.className = getClassName({ disabled: props.disabled });

      if (props.disabled) {
        props.onClick = (event) => {
          event.preventDefault();
          log.warn(oneLine`Not calling onClick() for Button link to
            ${props.href || props.to} because it is disabled`);
        };
      }
      return <Link {...props}>{children}</Link>;
    }

    return (
      <button className={getClassName()} {...props}>
        {children}
      </button>
    );
  }
}
