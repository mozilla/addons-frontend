import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import InstallSwitch from 'core/components/InstallSwitch';
import { ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { getThemeData } from 'core/themePreview';
import { clientSupportsAddons as _clientSupportsAddons } from 'core/utils';
import Button from 'ui/components/Button';

import './styles.scss';


export class InstallButtonBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    clientSupportsAddons: PropTypes.func,
    className: PropTypes.string,
    hasAddonManager: PropTypes.bool,
    i18n: PropTypes.object.isRequired,
    installTheme: PropTypes.func.isRequired,
    size: PropTypes.string,
    status: PropTypes.string.isRequired,
  }

  static defaultProps = {
    clientSupportsAddons: _clientSupportsAddons,
  }

  installTheme = (event) => {
    event.preventDefault();
    const { addon, status, installTheme } = this.props;
    installTheme(event.currentTarget, { ...addon, status });
  }

  render() {
    const {
      addon,
      clientSupportsAddons,
      className,
      hasAddonManager,
      i18n,
      size,
    } = this.props;
    const useButton = hasAddonManager !== undefined && !hasAddonManager;
    let button;
    const buttonIsDisabled = !clientSupportsAddons();
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
      button = (
        <Button
          href={buttonIsDisabled ? null : addon.installURL}
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

export default compose(
  translate(),
)(InstallButtonBase);
