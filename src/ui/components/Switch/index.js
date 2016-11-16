import React, { PropTypes } from 'react';
import classNames from 'classnames';

import './Switch.scss';

export default class Switch extends React.Component {
  static propTypes = {
    checked: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onClick: PropTypes.func,
    progress: PropTypes.number,
    success: PropTypes.bool,
  }

  static defaultProps = {
    checked: false,
    disabled: false,
    success: false,
  }

  getProgress() {
    const { progress } = this.props;
    if (progress === Infinity) {
      return 100;
    } else if (progress === -Infinity) {
      return 0;
    }
    return progress;
  }

  render() {
    const {
      checked, className, disabled, label, name, onChange, onClick, progress, success,
    } = this.props;
    const identifier = `install-button-${name}`;
    const hasProgress = progress !== undefined;
    const classes = classNames('Switch', className, {
      'Switch--indefinite': progress === Infinity,
      'Switch--indefinite-reverse': progress === -Infinity,
      'Switch--progress': hasProgress && progress !== Infinity && progress !== -Infinity,
      'Switch--success': success,
    });

    return (
      <div className={classes} onClick={onClick}
        data-progress={hasProgress ? this.getProgress() : 0}>
        <input
          id={identifier}
          className="visually-hidden"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          type="checkbox" />
        <label htmlFor={identifier}>
          {hasProgress ? <div className="Switch-progress-bar" /> : null}
          <span className="visually-hidden">{label}</span>
        </label>
      </div>
    );
  }
}
