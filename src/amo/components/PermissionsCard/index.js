/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import ShowMoreCard from 'amo/components/ShowMoreCard';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { I18nType } from 'amo/types/i18n';

import { PermissionUtils } from './permissions';

import './styles.scss';

type Props = {|
  version: AddonVersionType | null,
  i18n: I18nType,
|};

export class PermissionsCardBase extends React.Component<Props> {
  render() {
    const { version, i18n } = this.props;

    if (!version || !version.file) {
      return null;
    }

    const permissionUtils = new PermissionUtils(i18n);

    const addonPermissions = permissionUtils.getCurrentPermissions({
      file: version.file,
    });

    if (
      !addonPermissions.optional.length &&
      !addonPermissions.required.length
    ) {
      return null;
    }

    const optionalContent = permissionUtils.formatPermissions(
      addonPermissions.optional,
    );
    const requiredContent = permissionUtils.formatPermissions(
      addonPermissions.required,
    );

    if (!optionalContent.length && !requiredContent.length) {
      return null;
    }

    return (
      <ShowMoreCard
        header={i18n.gettext('Permissions')}
        className="PermissionsCard"
        id="AddonDescription-permissions-card"
        maxHeight={300}
      >
        {requiredContent.length ? (
          <>
            <p className="PermissionsCard-subhead--required">
              {i18n.gettext('This add-on needs to:')}
            </p>
            <ul className="PermissionsCard-list--required">
              {requiredContent}
            </ul>
          </>
        ) : null}
        {optionalContent.length ? (
          <>
            <p className="PermissionsCard-subhead--optional">
              {i18n.gettext('This add-on may also ask to:')}
            </p>
            <ul className="PermissionsCard-list--optional">
              {optionalContent}
            </ul>
          </>
        ) : null}
        <Button
          buttonType="neutral"
          className="PermissionCard-learn-more"
          href="https://support.mozilla.org/kb/permission-request-messages-firefox-extensions"
          target="_blank"
          externalDark
          puffy
        >
          {i18n.gettext('Learn more about permissions')}
        </Button>
      </ShowMoreCard>
    );
  }
}

const PermissionsCard: React.ComponentType<Props> = compose(translate())(
  PermissionsCardBase,
);

export default PermissionsCard;
