import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import InstallSwitch from 'core/components/InstallSwitch';
import { ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
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
    size: PropTypes.string,
    status: PropTypes.string.isRequired,
    userAgentInfo: PropTypes.string.isRequired,
  }

  static defaultProps = {
    getClientCompatibility: _getClientCompatibility,
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
      size,
      userAgentInfo,
    } = this.props;
    const useButton = hasAddonManager !== undefined && !hasAddonManager;
    let button;

    const { compatible } = getClientCompatibility({
      addon, clientApp, userAgentInfo });

    const buttonIsDisabled = !compatible;
    const buttonClass = classNames('InstallButton-button', {
      'InstallButton-button--disabled': buttonIsDisabled,
    });

    if (addon.type === ADDON_TYPE_THEME) {
      button = (
        <Button
          disabled={buttonIsDisabled}
          data-browsertheme={JSON.stringify(getThemeData(addon))}
          onClick={this.installTheme}
          size={size}
          className={buttonClass}>
          {i18n.gettext('Install Theme')}
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
          disabled={buttonIsDisabled}
          to={addon.installURL}
          onClick={onClick}
          size={size}
          className={buttonClass}>
          {i18n.gettext('Add to Firefox')}
        </Button>
      );
    }
    return (
      <div className={classNames('InstallButton', className, {
        'InstallButton--use-button': useButton,
        'InstallButton--use-switch': !useButton,
      })}>
        <InstallSwitch {...this.props} className="InstallButton-switch"
          disabled={buttonIsDisabled} />
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
