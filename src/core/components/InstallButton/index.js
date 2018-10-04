/* global InstallTrigger, window */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import config from 'config';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { getAddonIconUrl } from 'core/imageUtils';
import InstallSwitch from 'core/components/InstallSwitch';
import {
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  INSTALL_ACTION,
  INSTALL_STARTED_ACTION,
  validAddonTypes,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { findInstallURL } from 'core/installAddon';
import log from 'core/logger';
import { getThemeData } from 'core/themeInstall';
import tracking, {
  getAddonTypeForTracking,
  getAddonEventCategory,
} from 'core/tracking';
import { isTheme } from 'core/utils';
import { getFileHash } from 'core/utils/addons';
import { getClientCompatibility as _getClientCompatibility } from 'core/utils/compatibility';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';

import './styles.scss';

export class InstallButtonBase extends React.Component {
  static propTypes = {
    accentcolor: PropTypes.string,
    addon: PropTypes.object.isRequired,
    author: PropTypes.string,
    category: PropTypes.string,
    className: PropTypes.string,
    clientApp: PropTypes.string.isRequired,
    defaultInstallSource: PropTypes.string.isRequired,
    description: PropTypes.string,
    detailURL: PropTypes.string,
    enable: PropTypes.func,
    footer: PropTypes.string,
    footerURL: PropTypes.string,
    getClientCompatibility: PropTypes.func,
    guid: PropTypes.string.isRequired,
    handleChange: PropTypes.func,
    hasAddonManager: PropTypes.bool.isRequired,
    header: PropTypes.string,
    headerURL: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    iconURL: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    // See ReactRouterLocationType in 'core/types/router'
    location: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    previewURL: PropTypes.string,
    slug: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    textcolor: PropTypes.string,
    type: PropTypes.oneOf(validAddonTypes),
    uninstall: PropTypes.func.isRequired,
    updateURL: PropTypes.string,
    useButton: PropTypes.bool,
    userAgentInfo: PropTypes.object.isRequired,
    version: PropTypes.string,
    _InstallTrigger: PropTypes.object,
    _config: PropTypes.object,
    _log: PropTypes.object,
    _tracking: PropTypes.object,
    _window: PropTypes.object,
  };

  static defaultProps = {
    getClientCompatibility: _getClientCompatibility,
    useButton: false,
    _InstallTrigger:
      typeof InstallTrigger !== 'undefined' ? InstallTrigger : null,
    _config: config,
    _log: log,
    _tracking: tracking,
    _window: typeof window !== 'undefined' ? window : {},
  };

  installTheme = (event) => {
    event.preventDefault();
    const { addon, status, installTheme } = this.props;

    installTheme(event.currentTarget, {
      name: addon.name,
      status,
      type: addon.type,
    });
  };

  installExtension = ({ installURL, event }) => {
    const { addon, _InstallTrigger } = this.props;
    const { name, type } = addon;

    this.trackInstallStarted({ addonName: name, type });

    if (!_InstallTrigger) {
      // Let the button serve the file like a normal link.
      return true;
    }

    log.debug(`Installing addon "${addon.slug}" with InstallTrigger`);

    event.preventDefault();
    event.stopPropagation();

    // This is a Firefox API for installing extensions that
    // pre-dates mozAddonManager.
    //
    // See
    // https://developer.mozilla.org/en-US/docs/Web/API/InstallTrigger/install
    // https://github.com/mozilla/addons-server/blob/98c97f3ebce7f82b8c32f271df3034eae3245f1f/static/js/zamboni/buttons.js#L310
    //
    _InstallTrigger.install(
      {
        [name]: {
          Hash: getFileHash({ addon, installURL }),
          IconURL: getAddonIconUrl(addon),
          URL: installURL,
          // The old AMO did this so, hey, why not?
          toString: () => installURL,
        },
      },
      (xpiURL, status) => {
        log.debug(oneLine`InstallTrigger completed for "${xpiURL}";
        status=${status}`);

        if (status === 0) {
          // The extension was installed successfully.
          this.trackInstallSucceeded({
            addonName: name,
            type,
          });
        }
      },
    );

    return false;
  };

  trackInstallStarted({ addonName, type }) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: getAddonTypeForTracking(type),
      category: getAddonEventCategory(type, INSTALL_STARTED_ACTION),
      label: addonName,
    });
  }

  trackInstallSucceeded({ addonName, type }) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: getAddonTypeForTracking(type),
      category: getAddonEventCategory(type, INSTALL_ACTION),
      label: addonName,
    });
  }

  render() {
    const {
      addon,
      clientApp,
      className,
      defaultInstallSource,
      getClientCompatibility,
      hasAddonManager,
      i18n,
      location,
      userAgentInfo,
      _config,
      _log,
      _window,
    } = this.props;

    if (addon.type === ADDON_TYPE_OPENSEARCH && _config.get('server')) {
      _log.info('Not rendering opensearch install button on the server');
      return null;
    }

    const useButton =
      // mozAddonManager may only be available on the client.
      (_config.get('client') && !hasAddonManager) ||
      // OpenSearch plugins display their own prompt so using the "Add to
      // Firefox" button regardless on mozAddonManager support is a better UX.
      addon.type === ADDON_TYPE_OPENSEARCH ||
      this.props.useButton;
    let button;

    const { compatible } = getClientCompatibility({
      addon,
      clientApp,
      userAgentInfo,
    });

    const buttonIsDisabled = !compatible;
    const buttonClass = makeClassName(
      'InstallButton-button',
      'Button--action',
      className,
      {
        'InstallButton-button--disabled': buttonIsDisabled,
      },
    );
    const installURL = findInstallURL({
      defaultInstallSource,
      location,
      platformFiles: addon.platformFiles,
      userAgentInfo,
    });

    if (addon.type === ADDON_TYPE_THEME) {
      button = (
        <Button
          buttonType="action"
          className={buttonClass}
          disabled={buttonIsDisabled}
          data-browsertheme={JSON.stringify(getThemeData(addon))}
          onClick={this.installTheme}
          puffy
        >
          <Icon name="plus" />
          {i18n.gettext('Install Theme')}
        </Button>
      );
    } else if (addon.type === ADDON_TYPE_OPENSEARCH) {
      const onClick = buttonIsDisabled
        ? null
        : (event) => {
            event.preventDefault();
            event.stopPropagation();

            _log.info('Adding OpenSearch Provider', { addon });
            _window.external.AddSearchProvider(installURL);
            this.trackInstallStarted({
              addonName: addon.name,
              type: addon.type,
            });

            return false;
          };
      button = (
        <Button
          buttonType="action"
          className={buttonClass}
          disabled={buttonIsDisabled}
          onClick={onClick}
          href={installURL}
          prependClientApp={false}
          prependLang={false}
          puffy
        >
          <Icon name="plus" />
          {i18n.gettext('Add to Firefox')}
        </Button>
      );
    } else {
      const onClick = buttonIsDisabled
        ? (event) => {
            event.preventDefault();
            event.stopPropagation();
            return false;
          }
        : (event) => {
            this.installExtension({ event, installURL });
          };

      const buttonText = isTheme(addon.type)
        ? i18n.gettext('Install Theme')
        : i18n.gettext('Add to Firefox');

      button = (
        <Button
          buttonType="action"
          className={buttonClass}
          disabled={buttonIsDisabled}
          onClick={onClick}
          href={installURL}
          prependClientApp={false}
          prependLang={false}
          puffy
        >
          <Icon name="plus" />
          {buttonText}
        </Button>
      );
    }
    return (
      <div
        className={makeClassName('InstallButton', {
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
          category={this.props.category}
          className="InstallButton-switch"
          description={this.props.description}
          detailURL={this.props.detailURL}
          disabled={buttonIsDisabled}
          enable={this.props.enable}
          footer={this.props.footer}
          footerURL={this.props.footerURL}
          guid={this.props.guid}
          handleChange={this.props.handleChange}
          header={this.props.header}
          headerURL={this.props.headerURL}
          iconURL={this.props.iconURL}
          id={this.props.id}
          install={this.props.install}
          installTheme={this.props.installTheme}
          installURL={installURL}
          name={this.props.name}
          previewURL={this.props.previewURL}
          slug={this.props.slug}
          status={this.props.status}
          textcolor={this.props.textcolor}
          type={this.props.type}
          uninstall={this.props.uninstall}
          updateURL={this.props.updateURL}
          version={this.props.version}
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

const InstallButton = compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(InstallButtonBase);

export default InstallButton;
