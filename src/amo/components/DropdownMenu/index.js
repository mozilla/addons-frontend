/* @flow */
/* global window */
import { oneLine } from 'common-tags';
import * as React from 'react';
import makeClassName from 'classnames';
import onClickOutside from 'react-onclickoutside';

import log from 'amo/logger';
import Icon from 'amo/components/Icon';
import type {
  ElementEvent,
  HTMLElementEventHandler,
  InputEvent,
} from 'amo/types/dom';

import './styles.scss';

type Props = {|
  text: string,
  children?: React.ChildrenArray<React.Node>,
  className?: string,
|};

type DefaultProps = {|
  _window: typeof window,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
|};

type State = {|
  buttonIsActive: boolean,
|};

export class DropdownMenuBase extends React.Component<InternalProps, State> {
  static defaultProps: DefaultProps = {
    _window: typeof window !== 'undefined' ? window : null,
  };

  constructor(props: InternalProps) {
    super(props);

    this.state = { buttonIsActive: false };
  }

  handleOnClick: HTMLElementEventHandler = (event: ElementEvent) => {
    event.preventDefault();

    this.setState((previousState) => ({
      buttonIsActive: !previousState.buttonIsActive,
    }));
  };

  handleOnClickForLinks: (event: InputEvent) => void = (event: InputEvent) => {
    // If a link inside the menu is clicked, we should close the dropdown.
    // See: https://github.com/mozilla/addons-frontend/issues/3452
    if (event.target && event.target.tagName === 'A') {
      log.debug(oneLine`Setting state of DropdownMenu to buttonIsActive to
        false, because a link inside the menu was clicked.`);
      this.setState({ buttonIsActive: false });
    }
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  handleClickOutside: () => void = () => {
    this.setState({ buttonIsActive: false });
  };

  handleOnMouseEnter: () => void = () => {
    const { _window } = this.props;

    // Check device is actually capable of proper hover handling because touch
    // emulation can mess up with click event later.
    // https://github.com/mozilla/addons-frontend/issues/11137#issuecomment-1039218104
    if (_window && _window.matchMedia('(hover)').matches) {
      this.setState({ buttonIsActive: true });
    }
  };

  handleOnMouseLeave: () => void = () => {
    const { _window } = this.props;

    // As above, check device is actually capable of hover through media query.
    if (_window && _window.matchMedia('(hover)').matches) {
      this.setState({ buttonIsActive: false });
    }
  };

  render(): React.Node {
    const { children, className, text } = this.props;

    // ESLint doesn't like the event handlers we attach to the
    // div below, but they're just re-creating hover in JS and dismissing
    // the menu when links inside it are clicked, so it's not really
    // an interactive element.
    // eslint-disable-next-line max-len
    /* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
    return (
      <div
        className={makeClassName('DropdownMenu', className, {
          'DropdownMenu--active': this.state.buttonIsActive,
        })}
        onClick={this.handleOnClickForLinks}
        onMouseEnter={this.handleOnMouseEnter}
        onMouseLeave={this.handleOnMouseLeave}
      >
        <button
          className="DropdownMenu-button"
          onClick={this.handleOnClick}
          title={text}
          type="button"
          aria-haspopup="true"
        >
          <span className="DropdownMenu-button-text">{text}</span>
          <Icon name="inverted-caret" />
        </button>

        {children && (
          <ul
            className="DropdownMenu-items"
            aria-hidden={!this.state.buttonIsActive}
            aria-label="submenu"
          >
            {children}
          </ul>
        )}
      </div>
    );

    // eslint-disable-next-line max-len
    /* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
  }
}

export default (onClickOutside(DropdownMenuBase): React.ComponentType<Props>);
