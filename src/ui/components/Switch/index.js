import * as React from 'react';
import PropTypes from 'prop-types';
import makeClassName from 'classnames';

import './styles.scss';

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
  };

  static defaultProps = {
    checked: false,
    disabled: false,
    success: false,
  };

  getProgress() {
    const { progress } = this.props;
    if (progress === Infinity) {
      return 100;
    }
    if (progress === -Infinity) {
      return 0;
    }
    return progress;
  }

  render() {
    const {
      checked,
      className,
      disabled,
      label,
      name,
      onChange,
      onClick,
      progress,
      success,
    } = this.props;
    const identifier = `install-button-${name}`;
    const hasProgress = progress !== undefined;
    const classes = makeClassName('Switch', className, {
      'Switch--indefinite': progress === Infinity,
      'Switch--indefinite-reverse': progress === -Infinity,
      'Switch--progress':
        hasProgress && progress !== Infinity && progress !== -Infinity,
      'Switch--success': success,
    });

    return (
      // TODO: fix this by updating to handle enter keypress and make role="button"
      // eslint-disable-next-line max-len
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
      <div
        className={classes}
        onClick={onClick}
        data-progress={hasProgress ? this.getProgress() : 0}
      >
        <input
          id={identifier}
          className="visually-hidden"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          type="checkbox"
        />
        <label htmlFor={identifier}>
          {hasProgress ? <div className="Switch-progress-bar" /> : null}
          <span className="visually-hidden">{label}</span>
        </label>
      </div>
    );
  }
}
