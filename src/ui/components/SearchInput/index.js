/* global document, window */
import React, { PropTypes } from 'react';
import classNames from 'classnames';

import './style.scss';

export default class SearchInput extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    inputRef: PropTypes.func,
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
  }

  componentDidMount() {
    this.setIconPosition();
    window.addEventListener('resize', this.setIconPosition);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setIconPosition);
  }

  onBlur = () => {
    if (!this.input.value) {
      this.root.classList.remove('SearchInput--text');
    }
  }

  onFocus = () => {
    this.root.classList.add('SearchInput--text');
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
    const id = `SearchInput-input-${name}`;
    return (
      <div className={classNames(className, 'SearchInput')} ref={(el) => { this.root = el; }}>
        <i
          className="Icon-magnifying-glass SearchInput-animation-icon"
          ref={(el) => { this.animateIcon = el; }} />
        <label className="SearchInput-label" htmlFor={id}>
          <i className="Icon-magnifying-glass" ref={(el) => { this.labelIcon = el; }} />
          {placeholder}
        </label>
        <input
          {...props} className="SearchInput-input" placeholder={placeholder} id={id} name={name}
          autoComplete="off" ref={this.inputRefs(inputRef)}
          onFocus={this.onFocus} onBlur={this.onBlur} />
      </div>
    );
  }
}
