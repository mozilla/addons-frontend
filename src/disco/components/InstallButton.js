import React, { PropTypes } from 'react';

import { gettext as _ } from 'core/utils';

import 'disco/css/InstallButton.scss';
import {
  DOWNLOADING,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
} from 'disco/constants';


const validStates = [
  DOWNLOADING,
  INSTALLED,
  INSTALLING,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
];

export default class InstallButton extends React.Component {

  static propTypes = {
    addonState: PropTypes.oneOf(validStates),
    downloadProgressPercent: PropTypes.number,
    handleClick: PropTypes.func,
    handleChange: PropTypes.func,
  }

  static defaultProps = {
    addonState: UNKNOWN,
    downloadProgressPercent: 0,
  }

  render() {
    const { addonState, downloadProgressPercent } = this.props;

    if (validStates.indexOf(addonState) === -1) {
      throw new Error('Invalid addonState');
    }

    const isInstalled = addonState === INSTALLED;
    const isDisabled = addonState === UNKNOWN;
    const isDownloading = addonState === DOWNLOADING;
    const switchClasses = `switch ${addonState}`;

    return (
      <div className={switchClasses} onClick={this.props.handleClick}
        data-download-progress={isDownloading ? downloadProgressPercent : 0}>
        <input
          className="visually-hidden"
          checked={isInstalled}
          disabled={isDisabled}
          onChange={this.props.handleChange}
          type="checkbox" />
        <label>
          {isDownloading ? <div className="progress"></div> : null}
          <span className="visually-hidden">{_('Install')}</span>
        </label>
      </div>
    );
  }
}
