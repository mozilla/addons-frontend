import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import InstallSwitch from 'core/components/InstallSwitch';
import { THEME_TYPE } from 'core/constants';
import translate from 'core/i18n/translate';
import { getThemeData } from 'core/themePreview';
import Button from 'ui/components/Button';

import './styles.scss';


export class InstallButtonBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    className: PropTypes.string,
    hasAddonManager: PropTypes.bool,
    i18n: PropTypes.object.isRequired,
    installTheme: PropTypes.func.isRequired,
    size: PropTypes.string,
    status: PropTypes.string.isRequired,
  }

  installTheme = (event) => {
    event.preventDefault();
    const { addon, status, installTheme } = this.props;
    installTheme(event.currentTarget, { ...addon, status });
  }

  render() {
    const { addon, className, hasAddonManager, i18n, size } = this.props;
    const useButton = hasAddonManager !== undefined && !hasAddonManager;
    let button;
    if (addon.type === THEME_TYPE) {
      button = (
        <Button
          data-browsertheme={JSON.stringify(getThemeData(addon))}
          onClick={this.installTheme}
          size={size}
          className="InstallButton-button">
          {i18n.gettext('Install Theme')}
        </Button>
      );
    } else {
      button = (
        <Button href={addon.installURL} size={size} className="InstallButton-button">
          {i18n.gettext('Add to Firefox')}
        </Button>
      );
    }
    return (
      <div className={classNames('InstallButton', className, {
        'InstallButton--use-button': useButton,
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
