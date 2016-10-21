/* global document, window */
import React, { PropTypes } from 'react';
import './style.scss';

class CentredInput extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    inputRef: PropTypes.func,
    name: PropTypes.string,
    offset: PropTypes.number,
  }

  static defaultProps = {
    ofset: 0,
  }

  componentDidMount() {
    this.setInputPosition();
    window.addEventListener('resize', this.setInputPosition);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setInputPosition);
  }

  setInputPosition = () => {
    if (this.input.value) {
      this.resetInputPosition();
      this.hidePlaceholder();
    } else {
      this.showPlaceholder();
      const { offset } = this.props;
      if (document.dir === 'rtl') {
        const parentRight = this.label.parentElement.getBoundingClientRect().right;
        const { right } = this.label.getBoundingClientRect();
        const paddingRight = parseFloat(window.getComputedStyle(this.label).paddingRight);
        this.input.style.paddingRight = `${-right + parentRight + paddingRight + offset}px`;
        this.input.style.paddingLeft = '';
      } else {
        const parentLeft = this.label.parentElement.getBoundingClientRect().left;
        const { left } = this.label.getBoundingClientRect();
        const paddingLeft = parseFloat(window.getComputedStyle(this.label).paddingLeft);
        this.input.style.paddingLeft = `${-parentLeft + paddingLeft + left + offset}px`;
        this.input.style.paddingRight = '';
      }
    }
  }

  showPlaceholder() {
    this.root.classList.remove('CentredInput--centre-text');
  }

  hidePlaceholder() {
    this.root.classList.add('CentredInput--centre-text');
  }

  resetInputPosition = () => {
    this.input.style.paddingLeft = '';
  }

  render() {
    const { children, className, name, inputRef, ...props } = this.props;
    const refs = [(el) => { this.input = el; }];
    if (inputRef) {
      refs.push(inputRef);
    }
    const allRefs = (el) => {
      refs.forEach((fn) => {
        fn(el);
      });
    };
    const id = `CentredInput-input-${name}`;
    return (
      <div className={[className, 'CentredInput'].join(' ')} ref={(el) => { this.root = el; }}>
        <label className="CentredInput-label" ref={(el) => { this.label = el; }} htmlFor={id}>
          {children}
        </label>
        <input
          {...props} className="CentredInput-input" id={id} name={name}
          onInput={this.setInputPosition} onFocus={this.setInputPosition}
          onBlur={this.resetInputPosition} ref={allRefs} />
      </div>
    );
  }
}

export default CentredInput;
