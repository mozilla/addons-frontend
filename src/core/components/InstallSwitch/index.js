import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import {
  DOWNLOADING,
  DISABLED,
  ENABLED,
  ENABLING,
  INSTALLING,
  INSTALLED,
  ADDON_TYPE_THEME,
  UNINSTALLED,
  UNINSTALLING,
  UNKNOWN,
  validAddonTypes,
  validInstallStates as validStates,
} from 'core/constants';
import log from 'core/logger';
import Switch from 'ui/components/Switch';

export class InstallSwitchBase extends React.Component {
  static propTypes = {
    accentcolor: PropTypes.string,
    addon: PropTypes.object.isRequired,
    author: PropTypes.string,
    category: PropTypes.string,
    description: PropTypes.string,
    detailURL: PropTypes.string,
    disabled: PropTypes.bool,
    downloadProgress: PropTypes.number,
    enable: PropTypes.func,
    footer: PropTypes.string,
    footerURL: PropTypes.string,
    guid: PropTypes.string.isRequired,
    handleChange: PropTypes.func,
    header: PropTypes.string,
    headerURL: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    iconURL: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    installURL: PropTypes.string,
    name: PropTypes.string.isRequired,
    previewURL: PropTypes.string,
    slug: PropTypes.string.isRequired,
    status: PropTypes.oneOf(validStates),
    textcolor: PropTypes.string,
    type: PropTypes.oneOf(validAddonTypes),
    uninstall: PropTypes.func.isRequired,
    updateURL: PropTypes.string,
    version: PropTypes.string,
  };

  static defaultProps = {
    disabled: false,
    status: UNKNOWN,
    downloadProgress: 0,
  };

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
        label = i18n.gettext(
          '%(name)s is installed and enabled. Click to uninstall.',
        );
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

  getDownloadProgress() {
    const { downloadProgress, status } = this.props;
    if (status === DOWNLOADING) {
      return downloadProgress;
    }
    if ([INSTALLING, ENABLING].includes(status)) {
      return Infinity;
    }
    if (status === UNINSTALLING) {
      return -Infinity;
    }
    return undefined;
  }

  handleClick = (e) => {
    e.preventDefault();
    const {
      addon,
      disabled,
      enable,
      guid,
      install,
      name,
      status,
      installTheme,
      type,
      uninstall,
    } = this.props;

    if (disabled) {
      log.info(
        'handleClick for InstallSwitch disabled; disabled prop set to true.',
      );
      return;
    }

    if (type === ADDON_TYPE_THEME && [UNINSTALLED, DISABLED].includes(status)) {
      installTheme(this.themeData, {
        name: addon.name,
        status,
        type: addon.type,
      });
    } else if (status === UNINSTALLED) {
      install();
    } else if (status === DISABLED) {
      enable();
    } else if ([INSTALLED, ENABLED].includes(status)) {
      uninstall({ guid, name, type });
    }
  };

  render() {
    const browsertheme = JSON.stringify(this.props.addon.themeData);
    const { disabled, handleChange, slug, status, ...otherProps } = this.props;

    if (!validStates.includes(status)) {
      throw new Error(`Invalid add-on status ${status}`);
    }

    const isChecked = [INSTALLED, INSTALLING, ENABLING, ENABLED].includes(
      status,
    );
    const isDisabled = disabled || status === UNKNOWN;
    const isSuccess = [ENABLED, INSTALLED].includes(status);

    return (
      <div
        data-browsertheme={browsertheme}
        ref={(el) => {
          this.themeData = el;
        }}
      >
        <Switch
          {...otherProps}
          checked={isChecked}
          disabled={isDisabled}
          label={this.getLabel()}
          name={slug}
          onChange={handleChange}
          onClick={this.handleClick}
          progress={this.getDownloadProgress()}
          success={isSuccess}
          ref={(el) => {
            this.switchEl = el;
          }}
        />
      </div>
    );
  }
}

export default compose(translate())(InstallSwitchBase);
