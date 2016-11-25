import React, { PropTypes } from 'react';
import { compose } from 'redux';

import InstallSwitch from 'core/components/InstallSwitch';
import { THEME_TYPE } from 'core/constants';
import translate from 'core/i18n/translate';
import { getThemeData } from 'core/themePreview';
import Button from 'ui/components/Button';

export class InstallButtonBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    hasAddonManager: PropTypes.bool.isRequired,
    i18n: PropTypes.object.isRequired,
    installTheme: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
  }

  installTheme = (event) => {
    event.preventDefault();
    const { addon, status, installTheme } = this.props;
    installTheme(event.currentTarget, { ...addon, status });
  }

  render() {
    const { addon, hasAddonManager, i18n } = this.props;
    if (hasAddonManager) {
      return <InstallSwitch {...this.props} />;
    } else if (addon.type === THEME_TYPE) {
      return (
        <Button data-browsertheme={JSON.stringify(getThemeData(addon))} onClick={this.installTheme}>
          {i18n.gettext('Install Theme')}
        </Button>
      );
    }
    return <Button href={addon.installURL}>{i18n.gettext('Add to Firefox')}</Button>;
  }
}

export default compose(
  translate(),
)(InstallButtonBase);
