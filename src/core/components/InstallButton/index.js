/* global window */
import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import InstallSwitch from 'core/components/InstallSwitch';
import { ADDON_TYPE_OPENSEARCH, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { getThemeData } from 'core/themePreview';
import {
  getClientCompatibility as _getClientCompatibility,
} from 'core/utils';
import Button from 'ui/components/Button';

import './styles.scss';


export class InstallButtonBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    className: PropTypes.string,
    clientApp: PropTypes.string.isRequired,
    getClientCompatibility: PropTypes.func,
    hasAddonManager: PropTypes.bool,
    i18n: PropTypes.object.isRequired,
    installTheme: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    userAgentInfo: PropTypes.string.isRequired,
    _log: PropTypes.object,
    _window: PropTypes.object,
  }

  static defaultProps = {
    getClientCompatibility: _getClientCompatibility,
    _log: log,
    _window: typeof window !== 'undefined' ? window : {},
  }

  installTheme = (event) => {
    event.preventDefault();
    const { addon, status, installTheme } = this.props;
    installTheme(event.currentTarget, { ...addon, status });
  }

  render() {
    const {
      addon,
      clientApp,
      className,
      getClientCompatibility,
      hasAddonManager,
      i18n,
      userAgentInfo,
      _log,
      _window,
    } = this.props;

    // OpenSearch plugins display their own prompt so using the "Add to
    // Firefox" button regardless on mozAddonManager support is a better UX.
    const useButton = (hasAddonManager !== undefined && !hasAddonManager) ||
      addon.type === ADDON_TYPE_OPENSEARCH;
    let button;

    const { compatible } = getClientCompatibility({
      addon, clientApp, userAgentInfo });

    const buttonIsDisabled = !compatible;
    const buttonClass = classNames(
      'InstallButton-button', 'Button--action', className, {
        'InstallButton-button--disabled': buttonIsDisabled,
      }
    );

    if (addon.type === ADDON_TYPE_THEME) {
      button = (
        <Button
          className={buttonClass}
          disabled={buttonIsDisabled}
          data-browsertheme={JSON.stringify(getThemeData(addon))}
          onClick={this.installTheme}
        >
          {i18n.gettext('Install Theme')}
        </Button>
      );
    } else if (addon.type === ADDON_TYPE_OPENSEARCH) {
      const onClick = buttonIsDisabled ? null : (event) => {
        event.preventDefault();
        event.stopPropagation();

        _log.info('Adding OpenSearch Provider', { addon });
        _window.external.AddSearchProvider(addon.installURL);

        return false;
      };
      button = (
        <Button
          className={buttonClass}
          disabled={buttonIsDisabled}
          onClick={onClick}
          href={addon.installURL}
          prependClientApp={false}
          prependLang={false}
        >
          {i18n.gettext('Add to Firefox')}
        </Button>
      );
    } else {
      const onClick = buttonIsDisabled ? (event) => {
        event.preventDefault();
        event.stopPropagation();
        return false;
      } : null;
      button = (
        <Button
          className={buttonClass}
          disabled={buttonIsDisabled}
          onClick={onClick}
          href={addon.installURL}
          prependClientApp={false}
          prependLang={false}
        >
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
        <InstallSwitch
          {...this.props}
          className="InstallButton-switch"
          disabled={buttonIsDisabled}
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
