/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import type { AppState } from 'amo/store';
import { ADDON_TYPE_EXTENSION, CLIENT_APP_FIREFOX } from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import tracking from 'core/tracking';
import { isFirefox } from 'core/utils/compatibility';
import { withExperiment } from 'core/withExperiment';
import Notice from 'ui/components/Notice';
import type { UserAgentInfoType } from 'core/reducers/api';
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
  _log: typeof log,
  _tracking: typeof tracking,
  clientApp: string,
  className?: string,
  i18n: I18nType,
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
  'https://support.mozilla.org/kb/recommended-extensions-program#w_what-are-the-risks-of-installing-non-recommended-extensions';

export class InstallWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _log: log,
    _tracking: tracking,
  };

  couldShowWarning = () => {
    const {
      _couldShowWarning,
      addon,
      clientApp,
      isExperimentEnabled,
      userAgentInfo,
    } = this.props;
    return _couldShowWarning
      ? _couldShowWarning()
      : isFirefox({ userAgentInfo }) &&
          clientApp === CLIENT_APP_FIREFOX &&
          addon.type === ADDON_TYPE_EXTENSION &&
          !addon.is_recommended &&
          isExperimentEnabled;
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
    const { _log, _tracking, clientApp, variant } = this.props;

    if (!variant) {
      _log.debug(`No variant set for experiment "${EXPERIMENT_ID}"`);
      return;
    }

    if (clientApp === CLIENT_APP_FIREFOX) {
      _tracking.setDimension({
        dimension: INSTALL_WARNING_EXPERIMENT_DIMENSION,
        value: variant,
      });
    }

    this.maybeSendDisplayTrackingEvent();
  }

  render() {
    const { className, i18n, variant } = this.props;

    if (this.couldShowWarning() && variant === VARIANT_INCLUDE_WARNING) {
      return (
        <Notice
          actionHref={WARNING_LINK_DESTINATION}
          actionTarget="_blank"
          actionText={i18n.gettext('Learn more')}
          className={makeClassName('InstallWarning', className)}
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

export const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
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
