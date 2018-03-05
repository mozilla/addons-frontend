/* global InstallTrigger, window */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { getAddonIconUrl } from 'core/imageUtils';
import InstallSwitch from 'core/components/InstallSwitch';
import {
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  INSTALL_CATEGORY,
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


export const getFileHash = ({ addon, installURL } = {}) => {
  if (!addon) {
    throw new Error('The addon parameter cannot be empty');
  }
  if (!installURL) {
    throw new Error('The installURL parameter cannot be empty');
  }

  const urlKey = installURL.split('?')[0];

  // TODO: refactor createInternalAddon() to expose file objects
  // per platform so we don't have to do this.
  // https://github.com/mozilla/addons-frontend/issues/3871

  if (addon.current_version) {
    for (const file of addon.current_version.files) {
      // The API sometimes appends ?src= to URLs so we just check the
      // basename.
      if (file.url.startsWith(urlKey)) {
        return file.hash;
      }
    }
  }

  log.warn(oneLine`No file hash found for addon "${addon.slug}",
    installURL "${installURL}" (as "${urlKey}")`);

  return undefined;
};

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
    hasAddonManager: PropTypes.bool,
    header: PropTypes.string,
    headerURL: PropTypes.string,
    i18n: PropTypes.object.isRequired,
    iconURL: PropTypes.string,
    id: PropTypes.string,
    install: PropTypes.func.isRequired,
    installTheme: PropTypes.func.isRequired,
    // See ReactRouterLocation in 'core/types/router'
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
    userAgentInfo: PropTypes.string.isRequired,
    version: PropTypes.string,
    _InstallTrigger: PropTypes.object,
    _log: PropTypes.object,
    _tracking: PropTypes.object,
    _window: PropTypes.object,
  }

  static defaultProps = {
    getClientCompatibility: _getClientCompatibility,
    useButton: false,
    _InstallTrigger: typeof InstallTrigger !== 'undefined' ?
      InstallTrigger : null,
    _log: log,
    _tracking: tracking,
    _window: typeof window !== 'undefined' ? window : {},
  }

  installTheme = (event) => {
    event.preventDefault();
    const { addon, status, installTheme } = this.props;
    installTheme(event.currentTarget, { ...addon, status });
  }

  installExtension = ({ installURL, event }) => {
    const { addon, _InstallTrigger } = this.props;

    this.trackInstallStarted({ addonName: addon.name });

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
    _InstallTrigger.install({
      [addon.name]: {
        Hash: getFileHash({ addon, installURL }),
        IconURL: getAddonIconUrl(addon),
        URL: installURL,
        // The old AMO did this so, hey, why not?
        toString: () => installURL,
      },
    }, (xpiURL, status) => {
      log.debug(oneLine`InstallTrigger completed for "${xpiURL}";
        status=${status}`);

      if (status === 0) {
        // The extension was installed successfully.
        this.trackInstallSucceeded({ addonName: addon.name });
      }
    });

    return false;
  }

  trackInstallStarted({ addonName }) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: TRACKING_TYPE_EXTENSION,
      category: INSTALL_STARTED_CATEGORY,
      label: addonName,
    });
  }

  trackInstallSucceeded({ addonName }) {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: TRACKING_TYPE_EXTENSION,
      category: INSTALL_CATEGORY,
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
    const buttonClass = makeClassName(
      'InstallButton-button', 'Button--action', className, {
        'InstallButton-button--disabled': buttonIsDisabled,
      }
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
      const onClick = buttonIsDisabled ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        return false;
      } : (event) => {
        this.installExtension({ event, installURL });
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

export default compose(
  withRouter,
  connect(mapStateToProps),
  translate(),
)(InstallButtonBase);
