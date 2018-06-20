/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import type { AddonType } from 'core/types/addons';
import type { ApiStateType, UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';

import { PermissionUtils } from './permissions';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
  userAgentInfo: UserAgentInfoType,
|};

export class PermissionsCardBase extends React.Component<Props> {
  render() {
    const { addon, i18n, userAgentInfo } = this.props;

    if (!addon) {
      return null;
    }

    const permissionUtils = new PermissionUtils(i18n);

    const addonPermissions = permissionUtils.getCurrentPermissions(
      addon, userAgentInfo,
    );
    if (!addonPermissions.length) {
      return null;
    }

    const content = permissionUtils.formatPermissions(addonPermissions);
    if (!content.length) {
      return null;
    }

    return (
      <Card
        header={i18n.gettext('Permissions')}
        className="PermissionsCard"
      >
        <p className="PermissionsCard-subhead">{i18n.gettext('This add-on can:')}</p>
        <ul className="PermissionsCard-list">
          {content}
        </ul>
        <Button
          buttonType="neutral"
          className="PermissionCard-learn-more"
          href="https://support.mozilla.org/kb/permission-request-messages-firefox-extensions"
          rel="noopener noreferrer"
          target="_blank"
          externalDark
          puffy
        >
          {i18n.gettext('Learn more about permissions')}
        </Button>
      </Card>
    );
  }
}

export const mapStateToProps = (state: {| api: ApiStateType |}) => {
  return {
    userAgentInfo: state.api.userAgentInfo,
  };
};

const PermissionsCard: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(PermissionsCardBase);

export default PermissionsCard;
