import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import InstallSwitch from 'core/components/InstallSwitch';
import { ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { getThemeData } from 'core/themePreview';
import {
  isCompatibleWithUserAgent as _isCompatibleWithUserAgent,
  getCompabilityVersions,
} from 'core/utils';
import Button from 'ui/components/Button';

import './styles.scss';


export class InstallButtonBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    className: PropTypes.string,
    clientApp: PropTypes.string.isRequired,
    hasAddonManager: PropTypes.bool,
    i18n: PropTypes.object.isRequired,
    installTheme: PropTypes.func.isRequired,
    isCompatibleWithUserAgent: PropTypes.func,
    size: PropTypes.string,
    status: PropTypes.string.isRequired,
    userAgent: PropTypes.string.isRequired,
  }

  static defaultProps = {
    isCompatibleWithUserAgent: _isCompatibleWithUserAgent,
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
      hasAddonManager,
      i18n,
      isCompatibleWithUserAgent,
      size,
      userAgent,
    } = this.props;
    const useButton = hasAddonManager !== undefined && !hasAddonManager;
    let button;

    // Test add-on capability (is the client Firefox?) and compatibility
    // (is the client a valid version of Firefox to run this add-on?).
    const { maxVersion, minVersion } = getCompabilityVersions({
      addon, clientApp });
    const isCompatible = isCompatibleWithUserAgent({
      maxVersion, minVersion, userAgent });

    const buttonIsDisabled = !isCompatible;
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
          href={addon.installURL}
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
        <InstallSwitch {...this.props} className="InstallButton-switch" />
        {button}
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return { clientApp: state.api.clientApp, userAgent: state.api.userAgent };
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(InstallButtonBase);
