/* global window */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Icon from 'ui/components/Icon';

import './style.scss';

export default class SearchInput extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    value: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyDown: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    inputRef: PropTypes.func,
  }

  static defaultProps = {
    type: 'search',
    value: '',
  };

  constructor(props) {
    super(props);
    this.state = { animating: false, focus: false, value: props.value };
  }

  componentDidMount() {
    this.setIconPosition();
    window.addEventListener('resize', this.setIconPosition);
  }

  componentWillReceiveProps(nextProps) {
    const { value } = this.props;

    if (nextProps.value !== value) {
      this.setState({ value: nextProps.value });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setIconPosition);
  }

  onBlur = (e) => {
    this.setState({ focus: false }, () => {
      if (this.props.onBlur) {
        this.props.onBlur(e);
      }
    });

    if (!this.value) {
      // There is no transitionstart event, but animation will start if there is no value.
      this.setState({ animating: true });
    }
  }

  onFocus = (e) => {
    this.setState({ focus: true }, () => {
      if (this.props.onFocus) {
        this.props.onFocus(e);
      }
    });

    if (!this.value) {
      // There is no transitionstart event, but animation will start if there is no value.
      this.setState({ animating: true });
    }
    // Handle the possibility that onTransitionEnd will never fire if
    // the CSS animation is a no-op due to the size of text in the label.
    // CSS Animation time + 25ms.
    this.onTransitionEndTimeout = window.setTimeout(this.onTransitionEnd, 275);
  }

  onTransitionEnd = () => {
    if (this.onTransitionEndTimeout) {
      window.clearTimeout(this.onTransitionEndTimeout);
    }
    this.setState({ animating: false });
  }

  onChange = (e) => {
    e.persist();
    this.setState({ value: e.target.value }, () => {
      if (this.props.onChange) {
        this.props.onChange(e);
      }
    });
  }

  setIconPosition = () => {
    if (!this.animateLeft) {
      this.animateLeft = this.animateIcon.getBoundingClientRect().left;
    }
    const { left: labelLeft } = this.labelIcon.getBoundingClientRect();
    this.animateIcon.style.transform = `translateX(${labelLeft - this.animateLeft}px)`;
  }

  setInputRef = (el) => {
    this.input = el;

    if (this.props.inputRef) {
      this.props.inputRef(el);
    }
  }

  get value() {
    return this.state.value;
  }

  render() {
    const { className, name, placeholder, type } = this.props;
    const { onKeyDown } = this.props;
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
          autoComplete="off"
          className="SearchInput-input"
          id={id}
          name={name}
          value={value}
          type={type}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          onChange={this.onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          ref={this.setInputRef}
        />
      </div>
    );
  }
}
