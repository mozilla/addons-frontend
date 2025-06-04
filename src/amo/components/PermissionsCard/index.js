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

    const header = (
      <div className="PermissionsCard-header">
        {i18n.gettext('Permissions')}
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
    );

    return (
      <ShowMoreCard
        header={header}
        contentId={version.id}
        className="PermissionsCard"
        id="AddonDescription-permissions-card"
        maxHeight={300}
      >
        {requiredContent.length ? (
          <>
            <p className="PermissionsCard-subhead--required">
              {i18n.gettext('Required permissions:')}
            </p>
            <ul className="PermissionsCard-list--required">
              {requiredContent}
            </ul>
          </>
        ) : null}
        {optionalContent.length ? (
          <>
            <p className="PermissionsCard-subhead--optional">
              {i18n.gettext('Optional permissions:')}
            </p>
            <ul className="PermissionsCard-list--optional">
              {optionalContent}
            </ul>
          </>
        ) : null}
      </ShowMoreCard>
    );
  }
}

const PermissionsCard: React.ComponentType<Props> = compose(translate())(
  PermissionsCardBase,
);

export default PermissionsCard;
