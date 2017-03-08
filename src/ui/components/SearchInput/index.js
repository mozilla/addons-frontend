/* global document, window */
import React, { PropTypes } from 'react';
import classNames from 'classnames';

import Icon from 'ui/components/Icon';

import './style.scss';

export default class SearchInput extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    defaultValue: PropTypes.string,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = { animating: false, focus: false, value: props.defaultValue };
  }

  componentDidMount() {
    this.setIconPosition();
    window.addEventListener('resize', this.setIconPosition);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setIconPosition);
  }

  onBlur = () => {
    this.setState({ focus: false });
    if (!this.value) {
      // There is no transitionstart event, but animation will start if there is no value.
      this.setState({ animating: true });
    }
  }

  onFocus = () => {
    this.setState({ focus: true });
    if (!this.value) {
      // There is no transitionstart event, but animation will start if there is no value.
      this.setState({ animating: true });
    }
    // Handle the possibility that onTransitionEnd will never fire if
    // the CSS animation is a no-op due to the size of text in the label.
    // CSS Animation time + 25ms.
    this.onTransitionEndTimeout = window.setTimeout(this.onTransitionEnd, 275);
  }

  onInput = (e) => {
    this.setState({ value: e.target.value });
  }

  onTransitionEnd = () => {
    if (this.onTransitionEndTimeout) {
      window.clearTimeout(this.onTransitionEndTimeout);
    }
    this.setState({ animating: false });
  };

  setIconPosition = () => {
    if (!this.animateLeft) {
      this.animateLeft = this.animateIcon.getBoundingClientRect().left;
    }
    const { left: labelLeft } = this.labelIcon.getBoundingClientRect();
    this.animateIcon.style.transform = `translateX(${labelLeft - this.animateLeft}px)`;
  }

  get value() {
    return this.input.value;
  }

  render() {
    const { className, name, placeholder, ...props } = this.props;
    const { animating, focus, value } = this.state;
    const id = `SearchInput-input-${name}`;
    return (
      <div
        className={classNames(className, 'SearchInput', {
          'SearchInput--text': focus || value,
          'SearchInput--animating': animating,
        })}
        ref={(el) => { this.root = el; }}
      >
        <Icon
          name="magnifying-glass"
          className="SearchInput-animation-icon"
          getRef={(el) => { this.animateIcon = el; }}
          onTransitionEnd={this.onTransitionEnd}
        />
        <label className="SearchInput-label" htmlFor={id}>
          <Icon
            name="magnifying-glass"
            className="SearchInput-label-icon"
            getRef={(el) => { this.labelIcon = el; }}
          />
          {placeholder}
        </label>
        <input
          {...props} className="SearchInput-input" placeholder={placeholder} id={id} name={name}
          autoComplete="off" ref={(el) => { this.input = el; }} onInput={this.onInput}
          onFocus={this.onFocus} onBlur={this.onBlur} />
      </div>
    );
  }
}
