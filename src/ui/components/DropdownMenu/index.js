/* @flow */
import React from 'react';
import classNames from 'classnames';
import onClickOutside from 'react-onclickoutside';

import Icon from 'ui/components/Icon';
import DropdownMenuItem from 'ui/components/DropdownMenuItem';

import './styles.scss';


type Props = {|
  text: string,
  children: Array<DropdownMenuItem>,
  className?: string,
|};

export class DropdownMenuBase extends React.Component {
  constructor(props: Props) {
    super(props);

    this.state = { buttonIsActive: false };
  }

  state: {| buttonIsActive: bool |};
  props: Props;

  handleOnClick = (event: SyntheticEvent) => {
    event.preventDefault();

    this.setState((previousState) => ({
      buttonIsActive: !previousState.buttonIsActive,
    }));
  }

  handleClickOutside = () => {
    this.setState({ buttonIsActive: false });
  }

  render() {
    const { children, className, text } = this.props;

    return (
      <div
        className={classNames('DropdownMenu', className, {
          'DropdownMenu--active': this.state.buttonIsActive,
        })}
      >
        <button
          className="DropdownMenu-button"
          onClick={this.handleOnClick}
          title={text}
        >
          <span className="DropdownMenu-button-text">
            {text}
          </span>
          <Icon name="inverted-caret" />
        </button>

        {children && (
          <ul className="DropdownMenu-items">
            {children}
          </ul>
        )}
      </div>
    );
  }
}

export default onClickOutside(DropdownMenuBase);
