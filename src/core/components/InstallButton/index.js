import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';
import {
  DOWNLOADING,
  DISABLED,
  ENABLED,
  ENABLING,
  INSTALLING,
  INSTALLED,
  THEME_TYPE,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
  validAddonTypes,
  validInstallStates as validStates,
} from 'core/constants';
import { getThemeData } from 'disco/themePreview';

import './InstallButton.scss';

export class InstallButtonBase extends React.Component {
  static propTypes = {
    downloadProgress: PropTypes.number,
    enable: PropTypes.func,
    guid: PropTypes.string.isRequired,
    handleChange: PropTypes.func,
    i18n: PropTypes.object.isRequired,
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    installURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    status: PropTypes.oneOf(validStates),
    type: PropTypes.oneOf(validAddonTypes),
    uninstall: PropTypes.func.isRequired,
  }

  static defaultProps = {
    status: UNKNOWN,
    downloadProgress: 0,
  }

  getLabel() {
    const { i18n, name, status } = this.props;
    let label;
    switch (status) {
      case DOWNLOADING:
        label = i18n.gettext('Downloading %(name)s.');
        break;
      case INSTALLING:
        label = i18n.gettext('Installing %(name)s.');
        break;
      case ENABLED:
      case INSTALLED:
        label = i18n.gettext('%(name)s is installed and enabled. Click to uninstall.');
        break;
      case DISABLED:
        label = i18n.gettext('%(name)s is disabled. Click to enable.');
        break;
      case UNINSTALLING:
        label = i18n.gettext('Uninstalling %(name)s.');
        break;
      case UNINSTALLED:
        label = i18n.gettext('%(name)s is uninstalled. Click to install.');
        break;
      default:
        label = i18n.gettext('Install state for %(name)s is unknown.');
        break;
    }
    return i18n.sprintf(label, { name });
  }

  handleClick = (e) => {
    e.preventDefault();
    const {
      guid, enable, install, installURL, name, status, installTheme, type, uninstall,
    } = this.props;
    if (type === THEME_TYPE && [UNINSTALLED, DISABLED].includes(status)) {
      installTheme(this.themeData, guid, name);
    } else if (status === UNINSTALLED) {
      install();
    } else if (status === DISABLED) {
      enable();
    } else if ([INSTALLED, ENABLED].includes(status)) {
      uninstall({ guid, installURL, name, type });
    }
  }

  render() {
    const { downloadProgress, slug, status } = this.props;

    if (!validStates.includes(status)) {
      throw new Error('Invalid add-on status');
    }

    const isChecked = [INSTALLED, INSTALLING, ENABLING, ENABLED].includes(status);
    const isDisabled = status === UNKNOWN;
    const isDownloading = status === DOWNLOADING;
    const switchClasses = `switch ${status.toLowerCase()}`;
    const identifier = `install-button-${slug}`;

    return (
      <div className={switchClasses} onClick={this.handleClick}
        data-download-progress={isDownloading ? downloadProgress : 0}>
        <input
          id={identifier}
          className="visually-hidden"
          checked={isChecked}
          disabled={isDisabled}
          onChange={this.props.handleChange}
          data-browsertheme={JSON.stringify(getThemeData(this.props))}
          ref={(ref) => { this.themeData = ref; }}
          type="checkbox" />
        <label htmlFor={identifier}>
          {isDownloading ? <div className="progress" /> : null}
          <span className="visually-hidden">{this.getLabel()}</span>
        </label>
      </div>
    );
  }
}

export default translate()(InstallButtonBase);
