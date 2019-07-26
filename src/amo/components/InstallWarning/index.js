/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import type { AppState } from 'amo/store';
import { ADDON_TYPE_EXTENSION, UNINSTALLED, UNKNOWN } from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import tracking from 'core/tracking';
import { withExperiment } from 'core/withExperiment';
import Notice from 'ui/components/Notice';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { InstalledAddon } from 'core/reducers/installations';
import type { WithExperimentInjectedProps } from 'core/withExperiment';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type CouldShowWarningParams = {|
  addonIsExtension: boolean,
  addonIsRecommended: boolean | void,
  experimentIsEnabled: $PropertyType<
    WithExperimentInjectedProps,
    'experimentIsEnabled',
  >,
  installStatus: $PropertyType<InstalledAddon, 'status'>,
|};

export const couldShowWarning = ({
  addonIsExtension,
  addonIsRecommended,
  experimentIsEnabled,
  installStatus,
}: CouldShowWarningParams) => {
  return (
    addonIsExtension &&
    !addonIsRecommended &&
    experimentIsEnabled &&
    [UNINSTALLED, UNKNOWN].includes(installStatus)
  );
};

type InternalProps = {|
  ...Props,
  ...WithExperimentInjectedProps,
  _couldShowWarning: typeof couldShowWarning,
  _log: typeof log,
  _tracking: typeof tracking,
  i18n: I18nType,
  installStatus: $PropertyType<InstalledAddon, 'status'>,
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

export class InstallWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _couldShowWarning: couldShowWarning,
    _log: log,
    _tracking: tracking,
  };

  maybeSendDisplayTrackingEvent = () => {
    const {
      _couldShowWarning,
      _tracking,
      addon,
      experimentIsEnabled,
      installStatus,
      variant,
    } = this.props;

    if (
      _couldShowWarning({
        addonIsExtension: addon.type === ADDON_TYPE_EXTENSION,
        addonIsRecommended: addon.is_recommended,
        experimentIsEnabled,
        installStatus,
      }) &&
      variant
    ) {
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
    const {
      _couldShowWarning,
      addon,
      experimentIsEnabled,
      i18n,
      installStatus,
      variant,
    } = this.props;

    if (
      _couldShowWarning({
        addonIsExtension: addon.type === ADDON_TYPE_EXTENSION,
        addonIsRecommended: addon.is_recommended,
        experimentIsEnabled,
        installStatus,
      }) &&
      variant === VARIANT_INCLUDE_WARNING
    ) {
      return (
        <Notice
          actionHref="https://support.mozilla.org/kb/recommended-extensions-program"
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
