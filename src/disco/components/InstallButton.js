import React, { PropTypes } from 'react';
import translate from 'core/i18n/translate';

import {
  DOWNLOADING,
  DISABLED,
  ENABLED,
  INSTALLED,
  THEME_TYPE,
  UNINSTALLED,
  UNKNOWN,
  validAddonTypes,
  validInstallStates as validStates,
} from 'disco/constants';
import { getThemeData } from 'disco/themePreview';

import 'disco/css/InstallButton.scss';

export class InstallButton extends React.Component {
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
    url: PropTypes.string,
  }

  static defaultProps = {
    status: UNKNOWN,
    downloadProgress: 0,
  }

  handleClick = (e) => {
    e.preventDefault();
    const {
      guid, enable, install, installURL, name, status, installTheme, type, uninstall,
    } = this.props;
    if (type === THEME_TYPE && [UNINSTALLED, DISABLED].includes(status)) {
      installTheme(this.refs.themeData, guid, name);
    } else if (status === UNINSTALLED) {
      install();
    } else if (status === DISABLED) {
      enable();
    } else if ([INSTALLED, ENABLED].includes(status)) {
      uninstall({ guid, installURL, name, type });
    }
  }

  render() {
    const { downloadProgress, i18n, slug, status } = this.props;

    if (!validStates.includes(status)) {
      throw new Error('Invalid add-on status');
    }

    const isInstalled = [INSTALLED, ENABLED].includes(status);
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
          checked={isInstalled}
          disabled={isDisabled}
          onChange={this.props.handleChange}
          data-browsertheme={JSON.stringify(getThemeData(this.props))}
          ref="themeData"
          type="checkbox" />
        <label htmlFor={identifier}>
          {isDownloading ? <div className="progress"></div> : null}
          <span className="visually-hidden">{i18n.gettext('Install')}</span>
        </label>
      </div>
    );
  }
}

export default translate()(InstallButton);
