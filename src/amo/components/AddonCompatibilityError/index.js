/* @flow */
/* eslint-disable react/no-danger */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import {
  INCOMPATIBLE_OVER_MAX_VERSION,
  INCOMPATIBLE_UNSUPPORTED_PLATFORM,
} from 'amo/constants';
import { sanitizeHTML } from 'amo/utils';
import translate from 'amo/i18n/translate';
import { getVersionById } from 'amo/reducers/versions';
import { getClientCompatibility } from 'amo/utils/compatibility';
import Notice from 'amo/components/Notice';
import type { AppState } from 'amo/store';
import type { UserAgentInfoType } from 'amo/reducers/api';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './style.scss';

type Props = {|
  addon: AddonType | null,
|};

type DefaultProps = {|
  _getClientCompatibility: typeof getClientCompatibility,
|};

type PropsFromState = {|
  clientApp: string,
  currentVersion: AddonVersionType | null,
  userAgentInfo: UserAgentInfoType,
|};

type InternalProps = {|
  ...Props,
  ...DefaultProps,
  ...PropsFromState,
  i18n: I18nType,
|};

export class AddonCompatibilityErrorBase extends React.Component<InternalProps> {
  static defaultProps: DefaultProps = {
    _getClientCompatibility: getClientCompatibility,
  };

  render(): null | React.Node {
    const {
      _getClientCompatibility,
      addon,
      clientApp,
      currentVersion,
      i18n,
      userAgentInfo,
    } = this.props;

    if (!addon) {
      return null;
    }

    const compatibility = _getClientCompatibility({
      addon,
      clientApp,
      currentVersion,
      userAgentInfo,
    });

    if (compatibility.compatible) {
      return null;
    }

    const { reason } = compatibility;
    invariant(reason, 'reason is required');

    // There are only two reasons for which we would show this warning.
    if (
      ![
        INCOMPATIBLE_OVER_MAX_VERSION,
        INCOMPATIBLE_UNSUPPORTED_PLATFORM,
      ].includes(reason)
    ) {
      return null;
    }

    const message =
      reason === INCOMPATIBLE_OVER_MAX_VERSION
        ? i18n.gettext(
            'This add-on is not compatible with your version of Firefox.',
          )
        : i18n.gettext('This add-on is not available on your platform.');

    return (
      <Notice type="error" className="AddonCompatibilityError">
        <span
          className="AddonCompatibilityError-message"
          dangerouslySetInnerHTML={sanitizeHTML(message, ['a'])}
        />
      </Notice>
    );
  }
}

function mapStateToProps(state: AppState, ownProps: Props): PropsFromState {
  const { addon } = ownProps;

  let currentVersion = null;

  if (addon && addon.currentVersionId) {
    currentVersion = getVersionById({
      id: addon.currentVersionId,
      state: state.versions,
    });
  }

  return {
    clientApp: state.api.clientApp,
    currentVersion,
    userAgentInfo: state.api.userAgentInfo,
  };
}

const AddonCompatibilityError: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonCompatibilityErrorBase);

export default AddonCompatibilityError;
