/* @flow */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';

import Link from 'amo/components/Link';
import log from 'amo/logger';

import './styles.scss';

export type ButtonType =
  | 'neutral'
  | 'light'
  | 'action'
  | 'cancel'
  | 'confirm'
  | 'alert'
  | 'none';

export type DefaultProps = {|
  buttonType: ButtonType,
  disabled: boolean,
  htmlType?: string,
  micro: boolean,
  noLink: boolean,
  puffy: boolean,
|};

export type Props = {|
  ...DefaultProps,
  children?: React.Node,
  className?: string,
  externalDark?: boolean,
  href?: string,
  name?: number,
  onClick?: Function | null,
  title?: string | null,
  // TODO: make a better Object type.
  to?: string | Object,
  target?: string,
  type?: string,
|};

const BUTTON_TYPES = [
  'neutral',
  'light',
  'action',
  'cancel',
  'confirm',
  'alert',
  'none',
];

export default class Button extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    buttonType: 'none',
    disabled: false,
    htmlType: 'submit',
    micro: false,
    noLink: false,
    puffy: false,
  };

  render(): React.Node {
    const {
      buttonType,
      children,
      className,
      href,
      htmlType,
      micro,
      puffy,
      noLink,
      to,
      ...rest
    } = this.props;
    const props: {|
      ...$Rest<
        Props,
        {|
          buttonType: ButtonType,
          micro: boolean,
          noLink: boolean,
          puffy: boolean,
        |},
      >,

      prependClientApp?: boolean,
      prependLang?: boolean,
    |} = { ...rest };

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
      return (
        <span className={getClassName()} title={rest.title}>
          {children}
        </span>
      );
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
      // eslint-disable-next-line react/button-has-type
      <button className={getClassName()} type={htmlType} {...props}>
        {children}
      </button>
    );
  }
}
