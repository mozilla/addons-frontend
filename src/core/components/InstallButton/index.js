/* global window */
import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import InstallSwitch from 'core/components/InstallSwitch';
import {
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  INSTALL_STARTED_CATEGORY,
  TRACKING_TYPE_EXTENSION,
  validAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { findInstallURL } from 'core/installAddon';
import log from 'core/logger';
import { getThemeData } from 'core/themePreview';
import tracking from 'core/tracking';
import {
  getClientCompatibility as _getClientCompatibility,
} from 'core/utils/compatibility';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';

import './styles.scss';


export class InstallButtonBase extends React.Component {
  static propTypes = {
    accentcolor: PropTypes.string,
    addon: PropTypes.object.isRequired,
    author: PropTypes.string,
    className: PropTypes.string,
    clientApp: PropTypes.string.isRequired,
    description: PropTypes.string,
    enable: PropTypes.func,
    footerURL: PropTypes.string,
    getClientCompatibility: PropTypes.func,
    guid: PropTypes.string.isRequired,
    handleChange: PropTypes.func,
    hasAddonManager: PropTypes.bool,
    headerURL: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    id: PropTypes.string,
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    src: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    textcolor: PropTypes.string,
    type: PropTypes.oneOf(validAddonTypes),
    uninstall: PropTypes.func.isRequired,
    useButton: PropTypes.bool,
    userAgentInfo: PropTypes.string.isRequired,
    _log: PropTypes.object,
    _tracking: PropTypes.object,
    _window: PropTypes.object,
  }

  static defaultProps = {
    getClientCompatibility: _getClientCompatibility,
    useButton: false,
    _log: log,
    _tracking: tracking,
    _window: typeof window !== 'undefined' ? window : {},
  }

  installTheme = (event) => {
    event.preventDefault();
    const { addon, status, installTheme } = this.props;
    installTheme(event.currentTarget, { ...addon, status });
  }

  trackInstallStarted({ addonName }) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: TRACKING_TYPE_EXTENSION,
      category: INSTALL_STARTED_CATEGORY,
      label: addonName,
    });
  }

  render() {
    const {
      addon,
      clientApp,
      className,
      getClientCompatibility,
      hasAddonManager,
      i18n,
      src,
      userAgentInfo,
      _log,
      _window,
    } = this.props;

    // OpenSearch plugins display their own prompt so using the "Add to
    // Firefox" button regardless on mozAddonManager support is a better UX.
    const useButton = (hasAddonManager !== undefined && !hasAddonManager) ||
      addon.type === ADDON_TYPE_OPENSEARCH || this.props.useButton;
    let button;

    const { compatible } = getClientCompatibility({
      addon, clientApp, userAgentInfo });

    const buttonIsDisabled = !compatible;
    const buttonClass = classNames(
      'InstallButton-button', 'Button--action', className, {
        'InstallButton-button--disabled': buttonIsDisabled,
      }
    );
    const installURL = findInstallURL({
      installURLs: addon.installURLs, userAgentInfo, src,
    });

    if (addon.type === ADDON_TYPE_THEME) {
      button = (
        <Button
          className={buttonClass}
          disabled={buttonIsDisabled}
          data-browsertheme={JSON.stringify(getThemeData(addon))}
          onClick={this.installTheme}
        >
          <Icon name="plus" />
          {i18n.gettext('Install Theme')}
        </Button>
      );
    } else if (addon.type === ADDON_TYPE_OPENSEARCH) {
      const onClick = buttonIsDisabled ? null : (event) => {
        event.preventDefault();
        event.stopPropagation();

        _log.info('Adding OpenSearch Provider', { addon });
        _window.external.AddSearchProvider(installURL);
        this.trackInstallStarted({ addonName: addon.name });

        return false;
      };
      button = (
        <Button
          className={buttonClass}
          disabled={buttonIsDisabled}
          onClick={onClick}
          href={installURL}
          prependClientApp={false}
          prependLang={false}
        >
          <Icon name="plus" />
          {i18n.gettext('Add to Firefox')}
        </Button>
      );
    } else {
      const onClick = buttonIsDisabled ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        return false;
      } : () => {
        this.trackInstallStarted({ addonName: addon.name });
      };
      button = (
        <Button
          className={buttonClass}
          disabled={buttonIsDisabled}
          onClick={onClick}
          href={installURL}
          prependClientApp={false}
          prependLang={false}
        >
          <Icon name="plus" />
          {i18n.gettext('Add to Firefox')}
        </Button>
      );
    }
    return (
      <div
        className={classNames('InstallButton', {
          'InstallButton--use-button': useButton,
          'InstallButton--use-switch': !useButton,
        })}
      >
        {/*
          Some of these props are spread into InstallButton by:
          - the parent component
          - a state/dispatch mapper
          - a higher-order component (HOC)
          - evil clowns (maybe)
          - or something else we aren't sure of
          Also, some of these props are not used directly by `InstallSwitch`;
          they are required for `getThemeData()`.
        */}
        <InstallSwitch
          accentcolor={this.props.accentcolor}
          addon={this.props.addon}
          author={this.props.author}
          className="InstallButton-switch"
          description={this.props.description}
          disabled={buttonIsDisabled}
          enable={this.props.enable}
          footerURL={this.props.footerURL}
          guid={this.props.guid}
          handleChange={this.props.handleChange}
          headerURL={this.props.headerURL}
          id={this.props.id}
          install={this.props.install}
          installURL={installURL}
          installTheme={this.props.installTheme}
          name={this.props.name}
          slug={this.props.slug}
          status={this.props.status}
          textcolor={this.props.textcolor}
          type={this.props.type}
          uninstall={this.props.uninstall}
        />
        {button}
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    clientApp: state.api.clientApp,
    userAgentInfo: state.api.userAgentInfo,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(InstallButtonBase);
