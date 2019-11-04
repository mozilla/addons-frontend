/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import type { AppState } from 'amo/store';
import { ADDON_TYPE_EXTENSION, CLIENT_APP_FIREFOX } from 'core/constants';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import tracking from 'core/tracking';
import {
  correctedLocationForPlatform,
  isFirefox,
} from 'core/utils/compatibility';
import { NOT_IN_EXPERIMENT, withExperiment } from 'core/withExperiment';
import Notice, { genericWarningType, warningType } from 'ui/components/Notice';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocationType } from 'core/types/router';
import type { WithExperimentInjectedProps } from 'core/withExperiment';

import './styles.scss';

type Props = {|
  addon: AddonType,
|};

type InternalProps = {|
  ...Props,
  ...WithExperimentInjectedProps,
  _correctedLocationForPlatform: typeof correctedLocationForPlatform,
  _couldShowWarning?: () => boolean,
  _log: typeof log,
  _tracking: typeof tracking,
  clientApp: string,
  className?: string,
  i18n: I18nType,
  location: ReactRouterLocationType,
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
export const VARIANT_INCLUDE_WARNING_CURRENT = 'includeWarning-current';
export const VARIANT_INCLUDE_WARNING_PROPOSED = 'includeWarning-proposed';
export const VARIANT_EXCLUDE_WARNING = 'excludeWarning';
export const EXPERIMENT_VARIANTS = [
  { id: VARIANT_INCLUDE_WARNING_CURRENT, percentage: 0.2 },
  { id: VARIANT_INCLUDE_WARNING_PROPOSED, percentage: 0.2 },
  { id: VARIANT_EXCLUDE_WARNING, percentage: 0.2 },
  { id: NOT_IN_EXPERIMENT, percentage: 0.4 },
];
const WARNING_LINK_DESTINATION =
  'https://support.mozilla.org/kb/recommended-extensions-program#w_what-are-the-risks-of-installing-non-recommended-extensions';

export class InstallWarningBase extends React.Component<InternalProps> {
  static defaultProps = {
    _correctedLocationForPlatform: correctedLocationForPlatform,
    _log: log,
    _tracking: tracking,
  };

  couldShowWarning = () => {
    const {
      _correctedLocationForPlatform,
      _couldShowWarning,
      addon,
      clientApp,
      isExperimentEnabled,
      isUserInExperiment,
      location,
      userAgentInfo,
    } = this.props;

    // Do not show this warning if we are also going to show a WrongPlatformWarning.
    const correctedLocation = _correctedLocationForPlatform({
      clientApp,
      location,
      userAgentInfo,
    });

    return _couldShowWarning
      ? _couldShowWarning()
      : !correctedLocation &&
          isFirefox({ userAgentInfo }) &&
          clientApp === CLIENT_APP_FIREFOX &&
          addon.type === ADDON_TYPE_EXTENSION &&
          !addon.is_recommended &&
          isExperimentEnabled &&
          isUserInExperiment;
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
    const {
      _log,
      _tracking,
      clientApp,
      isUserInExperiment,
      variant,
    } = this.props;

    if (!variant) {
      _log.debug(`No variant set for experiment "${EXPERIMENT_ID}"`);
      return;
    }
    if (!isUserInExperiment) {
      _log.debug(`User not enrolled in experiment "${EXPERIMENT_ID}"`);
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

    if (
      this.couldShowWarning() &&
      [
        VARIANT_INCLUDE_WARNING_CURRENT,
        VARIANT_INCLUDE_WARNING_PROPOSED,
      ].includes(variant)
    ) {
      return (
        <Notice
          actionHref={WARNING_LINK_DESTINATION}
          actionTarget="_blank"
          actionText={i18n.gettext('Learn more')}
          className={makeClassName('InstallWarning', className)}
          type={
            variant === VARIANT_INCLUDE_WARNING_CURRENT
              ? warningType
              : genericWarningType
          }
        >
          {variant === VARIANT_INCLUDE_WARNING_CURRENT
            ? i18n.gettext(`This extension isn’t monitored by Mozilla. Make sure you trust the
            extension before you install it.`)
            : i18n.gettext(
                `This is not a Recommended Extension. Make sure you trust it before installing.`,
              )}
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
  withRouter,
  connect(mapStateToProps),
  translate(),
  withExperiment({
    id: EXPERIMENT_ID,
    variants: EXPERIMENT_VARIANTS,
  }),
)(InstallWarningBase);

export default InstallWarning;
