/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import log from 'core/logger';
import translate from 'core/i18n/translate';
import type { I18nType } from 'core/types/i18n';
import Permission from 'ui/components/Permission';

/* eslint-disable no-continue */
type Props = {|
  i18n: I18nType,
  permissions: Array<string>,
|};

type HostPermissionMessageType = 'domain' | 'site';
type PermissionMessageType = HostPermissionMessageType | 'allUrls';

type GetPermissionStringParams = {|
  messageType: PermissionMessageType,
  param?: string | number,
  tooMany?: boolean,
|};

type GenerateHostPermissionsParams = {|
  permissions: Array<string>,
  // eslint-disable-next-line react/no-unused-prop-types
  messageType: HostPermissionMessageType,
|};

export class HostPermissionsBase extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    this.i18n = props.i18n;
  }

  getPermissionString({ messageType, param, tooMany = false }: GetPermissionStringParams): string {
    // These should be kept in sync with Firefox's strings for webextention
    // host permissions which can be found in
    // https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
    switch (messageType) {
      case 'allUrls':
        return this.i18n.gettext('Access your data for all websites');
      case 'domain':
        if (tooMany) {
          return this.i18n.sprintf(this.i18n.ngettext(
            'Access your data in %(param)s other domain',
            'Access your data in %(param)s other domains',
            param), { param: this.i18n.formatNumber(param) }
          );
        }
        return this.i18n.sprintf(
          this.i18n.gettext('Access your data for sites in the %(param)s domain'),
          { param }
        );
      case 'site':
        if (tooMany) {
          return this.i18n.sprintf(this.i18n.ngettext(
            'Access your data on %(param)s other site',
            'Access your data on %(param)s other sites',
            param), { param: this.i18n.formatNumber(param) }
          );
        }
        return this.i18n.sprintf(
          this.i18n.gettext('Access your data for %(param)s'),
          { param }
        );
      default:
        return '';
    }
  }

  i18n: I18nType;

  // Generates Permission components for a list of host permissions. If we have 4 or
  // fewer, display them all, otherwise display the first 3 followed by an item
  // that says "...plus N others".
  generateHostPermissions({
    permissions, messageType,
  }: GenerateHostPermissionsParams): Array<React.Element<typeof Permission>> {
    const hostPermissions = [];
    for (const item of permissions.slice(0, 4)) {
      // Add individual Permission components for the first 4 host permissions.
      hostPermissions.push(
        <Permission
          type="hostPermission"
          description={this.getPermissionString({ messageType, param: item })}
          key={item}
        />
      );
    }
    if (permissions.length > 4) {
      // Replace the final individual permission with a "too many" permission.
      hostPermissions[3] = (<Permission
        type="hostPermission"
        description={this.getPermissionString(
          { messageType, param: permissions.length - 3, tooMany: true }
        )}
        key={messageType}
      />);
    }
    return hostPermissions;
  }

  render() {
    const { permissions } = this.props;
    const hostPermissions = [];

    // Group permissions into "site" and "domain" permissions. If any
    // "all urls" permissions are found, break as we'll only need one
    // host permissions message.
    let allUrls = false;
    const wildcards = [];
    const sites = [];
    for (const permission of permissions) {
      if (permission === '<all_urls>') {
        allUrls = true;
        break;
      }
      if (permission.startsWith('moz-extension:')) {
        continue;
      }
      const match = /^[a-z*]+:\/\/([^/]+)\//.exec(permission);
      if (!match) {
        log.debug(`Host permission string "${permission}" appears to be invalid.`);
        continue;
      }
      if (match[1] === '*') {
        allUrls = true;
      } else if (match[1].startsWith('*.')) {
        wildcards.push(match[1].slice(2));
      } else {
        sites.push(match[1]);
      }
    }

    // Format the host permissions. If we have a wildcard for all urls,
    // a single string will suffice.  Otherwise, show domain wildcards
    // first, then individual host permissions.
    if (allUrls) {
      hostPermissions.push(
        <Permission
          type="hostPermission"
          description={this.getPermissionString({ messageType: 'allUrls' })}
          key="allUrls"
        />
      );
    } else {
      hostPermissions.push(...this.generateHostPermissions({
        permissions: wildcards, messageType: 'domain',
      }));
      hostPermissions.push(...this.generateHostPermissions({
        permissions: sites, messageType: 'site',
      }));
    }
    return (
      <React.Fragment>
        {hostPermissions}
      </React.Fragment>
    );
  }
}

export default compose(
  translate(),
)(HostPermissionsBase);
