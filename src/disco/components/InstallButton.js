import React, { PropTypes } from 'react';
import translate from 'core/i18n/translate';

import {
  DOWNLOADING,
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
    handleChange: PropTypes.func,
    guid: PropTypes.string.isRequired,
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    installURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    uninstall: PropTypes.func.isRequired,
    url: PropTypes.string,
    downloadProgress: PropTypes.number,
    slug: PropTypes.string.isRequired,
    status: PropTypes.oneOf(validStates),
    type: PropTypes.oneOf(validAddonTypes),
  }

  static defaultProps = {
    status: UNKNOWN,
    downloadProgress: 0,
  }

  handleClick = (e) => {
    e.preventDefault();
    const {
      guid, i18n, install, installURL, name, status, installTheme, type, uninstall,
    } = this.props;
    if (type === THEME_TYPE && status === UNINSTALLED) {
      installTheme(this.refs.themeData, guid, name);
    } else if (status === UNINSTALLED) {
      install({ guid, i18n, installURL, name });
    } else if (status === INSTALLED) {
      uninstall({ guid, installURL, name, type });
    }
  }

  render() {
    const { downloadProgress, i18n, slug, status } = this.props;

    if (!validStates.includes(status)) {
      throw new Error('Invalid add-on status');
    }

    const isInstalled = status === INSTALLED;
    const isDisabled = status === UNKNOWN;
    const isDownloading = status === DOWNLOADING;
    const switchClasses = `switch ${status}`;
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
