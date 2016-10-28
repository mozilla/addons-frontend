/* global document, window */
import React, { PropTypes } from 'react';
import classNames from 'classnames';

import Icon from 'ui/components/Icon';

import './style.scss';

export default class SearchInput extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    defaultValue: PropTypes.string,
    inputRef: PropTypes.func,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = { focus: false, value: props.defaultValue };
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
  }

  onFocus = () => {
    this.setState({ focus: true });
  }

  onInput = (e) => {
    this.setState({ value: e.target.value });
  }

  onMouseDown = (e) => {
    this.setState({ focus: true });
    if (!this.input.value) {
      e.preventDefault();
      const setFocus = () => {
        this.input.focus();
        this.animateIcon.removeEventListener('transitionend', setFocus);
      };
      this.animateIcon.addEventListener('transitionend', setFocus);
    }
  }

  setIconPosition = () => {
    const { left: labelLeft } = this.labelIcon.getBoundingClientRect();
    const { left: animateLeft } = this.animateIcon.getBoundingClientRect();
    this.animateIcon.style.transform = `translateX(${labelLeft - animateLeft}px)`;
  }

  inputRefs(inputRef) {
    const refs = [(el) => { this.input = el; }];
    if (inputRef) {
      refs.push(inputRef);
    }
    return (el) => {
      refs.forEach((fn) => {
        fn(el);
      });
    };
  }

  render() {
    const { className, name, inputRef, placeholder, ...props } = this.props;
    const { focus, value } = this.state;
    const id = `SearchInput-input-${name}`;
    return (
      <div
        className={classNames(className, 'SearchInput', { 'SearchInput--text': focus || value })}
        ref={(el) => { this.root = el; }}
      >
        <Icon
          name="magnifying-glass" className="SearchInput-animation-icon"
          getRef={(el) => { this.animateIcon = el; }} />
        <label className="SearchInput-label" htmlFor={id}>
          <Icon name="magnifying-glass" getRef={(el) => { this.labelIcon = el; }} />
          {placeholder}
        </label>
        <input
          {...props} className="SearchInput-input" placeholder={placeholder} id={id} name={name}
          autoComplete="off" ref={this.inputRefs(inputRef)} onInput={this.onInput}
          onMouseDown={this.onMouseDown} onFocus={this.onFocus} onBlur={this.onBlur} />
      </div>
    );
  }
}
