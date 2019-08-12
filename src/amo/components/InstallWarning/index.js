/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import type { AppState } from 'amo/store';
import { hasAddonManager } from 'core/addonManager';
import { ADDON_TYPE_EXTENSION, UNINSTALLED, UNKNOWN } from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import tracking from 'core/tracking';
import { isFirefox } from 'core/utils/compatibility';
import { withExperiment } from 'core/withExperiment';
import Notice from 'ui/components/Notice';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { InstalledAddon } from 'core/reducers/installations';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { WithExperimentInjectedProps } from 'core/withExperiment';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  ...WithExperimentInjectedProps,
  _couldShowWarning?: () => boolean,
  _hasAddonManager: typeof hasAddonManager,
  _log: typeof log,
  _tracking: typeof tracking,
  i18n: I18nType,
  installStatus: $PropertyType<InstalledAddon, 'status'>,
  userAgentInfo: UserAgentInfoType,
|};

export const EXPERIMENT_CATEGORY_CLICK =
  'AMO Install Button Warning Experiment - Click';
export const EXPERIMENT_CATEGORY_DISPLAY =
  'AMO Install Button Warning Experiment - Display';
export const EXPERIMENT_ID = 'installButtonWarning';
// We use dimension6 because that is a custom GA dimension added for this
// particular experiment.
export const INSTALL_WARNING_EXPERIMENT_DIMENSION = 'dimension6';
export const VARIANT_INCLUDE_WARNING = 'includeWarning';
export const VARIANT_EXCLUDE_WARNING = 'excludeWarning';
const WARNING_LINK_DESTINATION =
  'https://support.mozilla.org/kb/recommended-extensions-program';

export class InstallWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _hasAddonManager: hasAddonManager,
    _log: log,
    _tracking: tracking,
  };

  couldShowWarning = () => {
    const {
      _couldShowWarning,
      _hasAddonManager,
      addon,
      isExperimentEnabled,
      installStatus,
      userAgentInfo,
    } = this.props;
    return _couldShowWarning
      ? _couldShowWarning()
      : isFirefox({ userAgentInfo }) &&
          addon.type === ADDON_TYPE_EXTENSION &&
          !addon.is_recommended &&
          isExperimentEnabled &&
          (!_hasAddonManager() ||
            [UNINSTALLED, UNKNOWN].includes(installStatus));
  };

  maybeSendDisplayTrackingEvent = () => {
    const { _tracking, addon, variant } = this.props;

    if (this.couldShowWarning() && variant) {
      _tracking.sendEvent({
        action: variant,
        category: EXPERIMENT_CATEGORY_DISPLAY,
        label: addon.name,
      });
    }
  };

  componentDidMount() {
    const { _log, _tracking, variant } = this.props;

    if (!variant) {
      _log.debug(`No variant set for experiment "${EXPERIMENT_ID}"`);
      return;
    }

    _tracking.setDimension({
      dimension: INSTALL_WARNING_EXPERIMENT_DIMENSION,
      value: variant,
    });

    this.maybeSendDisplayTrackingEvent();
  }

  componentDidUpdate({ installStatus: oldInstallStatus }: InternalProps) {
    const { installStatus: newInstallStatus } = this.props;

    if (newInstallStatus !== oldInstallStatus) {
      this.maybeSendDisplayTrackingEvent();
    }
  }

  render() {
    const { i18n, variant } = this.props;

    if (this.couldShowWarning() && variant === VARIANT_INCLUDE_WARNING) {
      return (
        <Notice
          actionHref={WARNING_LINK_DESTINATION}
          actionTarget="_blank"
          actionText={i18n.gettext('Learn more')}
          className="InstallWarning"
          type="warning"
        >
          {i18n.gettext(`This extension isn’t monitored by Mozilla. Make sure you trust the
            extension before you install it.`)}
        </Notice>
      );
    }
    return null;
  }
}

export const mapStateToProps = (state: AppState, ownProps: InternalProps) => {
  const { addon } = ownProps;
  const installedAddon = (addon && state.installations[addon.guid]) || {};

  return {
    installStatus: installedAddon.status,
    userAgentInfo: state.api.userAgentInfo,
  };
};

const InstallWarning: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withExperiment({
    id: EXPERIMENT_ID,
    variantA: VARIANT_INCLUDE_WARNING,
    variantB: VARIANT_EXCLUDE_WARNING,
  }),
)(InstallWarningBase);

export default InstallWarning;
