import React from 'react';
import './style.scss';

class CentredInput extends React.Component {
  hidePlaceholder() {
    this.label.style.display = 'none';
    this.input.style.textAlign = 'center';
  }

  showPlaceholder() {
    this.label.style.display = '';
    this.input.style.textAlign = '';
  }

  setInputPosition = () => {
    if (this.input.value) {
      this.resetInputPosition();
      this.hidePlaceholder();
    } else {
      this.showPlaceholder();
      const offsetLeft = this.label.parentElement.getBoundingClientRect().left;
      const { left } = this.label.getBoundingClientRect();
      const paddingLeft = parseFloat(getComputedStyle(this.label).paddingLeft);
      this.input.style.paddingLeft = `${left + paddingLeft - offsetLeft}px`;
    }
  }

  resetInputPosition = () => {
    this.input.style.paddingLeft = '';
  }

  render() {
    const { className, name, placeholder, inputRef, ...props } = this.props;
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
      <div className={[className, 'CentredInput'].join(' ')}>
        <label className="CentredInput-label" ref={(el) => { this.label = el; }} htmlFor={id}>
          {placeholder}
        </label>
        <input
          {...props} className="CentredInput-input" placeholder={placeholder} id={id} name={name}
          onInput={this.setInputPosition} onFocus={this.setInputPosition}
          onBlur={this.resetInputPosition} ref={allRefs} />
      </div>
    );
  }
}

export default CentredInput;
