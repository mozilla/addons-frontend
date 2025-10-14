/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import ShowMoreCard from 'amo/components/ShowMoreCard';
import translate from 'amo/i18n/translate';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { I18nType } from 'amo/types/i18n';

import { PermissionUtils } from './permissions';

import './styles.scss';

type Props = {|
  version: AddonVersionType | null,
  i18n: I18nType,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class PermissionsCardBase extends React.Component<InternalProps> {
  render(): null | React.Node {
    const { version, i18n } = this.props;

    const permissionUtils = new PermissionUtils(i18n);

    if (!version || !version.file) {
      return null;
    }

    const addonPermissions = permissionUtils.getCurrentPermissions({
      file: version.file,
    });

    if (
      !addonPermissions.permissions.optional.length &&
      !addonPermissions.permissions.required.length &&
      !addonPermissions.data_collection_permissions.optional.length &&
      !addonPermissions.data_collection_permissions.required.length
    ) {
      return null;
    }

    const optionalPermissionsContent = permissionUtils.formatPermissions(
      addonPermissions.permissions.optional,
    );
    const requiredPermissionsContent = permissionUtils.formatPermissions(
      addonPermissions.permissions.required,
    );
    const optionalDataCollectionPermissionsContent =
      permissionUtils.formatPermissions(
        addonPermissions.data_collection_permissions.optional,
      );
    const requiredDataCollectionPermissionsContent =
      permissionUtils.formatPermissions(
        addonPermissions.data_collection_permissions.required,
      );

    if (
      !optionalPermissionsContent.length &&
      !requiredPermissionsContent.length &&
      !optionalDataCollectionPermissionsContent.length &&
      !requiredDataCollectionPermissionsContent.length
    ) {
      return null;
    }

    // 'none' is a special string that can only appear alone in required data
    // collection permissions, and the header changes when it appears.
    const requiredDataCollectionPermissionsHeader =
      addonPermissions.data_collection_permissions.required.length === 1 &&
      addonPermissions.data_collection_permissions.required[0] === 'none'
        ? i18n.gettext('Data collection:')
        : i18n.gettext('Required data collection, according to the developer:');

    return (
      <ShowMoreCard
        header={i18n.gettext('Permissions and data')}
        contentId={version.id}
        className="PermissionsCard"
        id="AddonDescription-permissions-card"
        maxHeight={300}
      >
        {requiredPermissionsContent.length ? (
          <>
            <h4 className="PermissionsCard-subhead--required">
              {i18n.gettext('Required permissions:')}
            </h4>
            <ul className="PermissionsCard-list--required">
              {requiredPermissionsContent}
            </ul>
          </>
        ) : null}
        {optionalPermissionsContent.length ? (
          <>
            <h4 className="PermissionsCard-subhead--optional">
              {i18n.gettext('Optional permissions:')}
            </h4>
            <ul className="PermissionsCard-list--optional">
              {optionalPermissionsContent}
            </ul>
          </>
        ) : null}
        {requiredDataCollectionPermissionsContent.length ? (
          <>
            <h4 className="PermissionsCard-subhead--required">
              {requiredDataCollectionPermissionsHeader}
            </h4>
            <ul className="PermissionsCard-list--required">
              {requiredDataCollectionPermissionsContent}
            </ul>
          </>
        ) : null}
        {optionalDataCollectionPermissionsContent.length ? (
          <>
            <h4 className="PermissionsCard-subhead--optional">
              {i18n.gettext(
                'Optional data collection, according to the developer:',
              )}
            </h4>
            <ul className="PermissionsCard-list--optional">
              {optionalDataCollectionPermissionsContent}
            </ul>
          </>
        ) : null}

        <div className="PermissionsCard-footer">
          <Link
            className="PermissionsCard-learn-more"
            href="https://support.mozilla.org/kb/permission-request-messages-firefox-extensions"
            target="_blank"
            externalDark
            prependClientApp={false}
            prependLang={false}
          >
            {i18n.gettext('Learn more')}
          </Link>
        </div>
      </ShowMoreCard>
    );
  }
}

const PermissionsCard: React.ComponentType<Props> = compose(translate())(
  PermissionsCardBase,
);

export default PermissionsCard;
