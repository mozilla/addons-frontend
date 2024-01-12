/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import type { I18nType } from 'amo/types/i18n';
import Permission from 'amo/components/Permission';

/* eslint-disable no-continue */
type Props = {|
  permissions: Array<string>,
|};

type InternalProps = {|
  ...Props,
  jed: I18nType,
|};

const domainMessageType: 'domainMessageType' = 'domainMessageType';
const siteMessageType: 'siteMessageType' = 'siteMessageType';
const allUrlsMessageType: 'allUrlsMessageType' = 'allUrlsMessageType';

type HostPermissionMessageType = 'domainMessageType' | 'siteMessageType';
type PermissionMessageType = HostPermissionMessageType | 'allUrlsMessageType';

type GetPermissionStringParams = {|
  messageType: PermissionMessageType,
  param?: string | number,
|};

type GenerateHostPermissionsParams = {|
  permissions: Array<string>,
  // eslint-disable-next-line react/no-unused-prop-types
  messageType: HostPermissionMessageType,
|};

export class HostPermissionsBase extends React.Component<InternalProps> {
  getPermissionString({
    messageType,
    param,
  }: GetPermissionStringParams): string {
    const { jed } = this.props;

    // These should be kept in sync with Firefox's strings for webextension
    // host permissions which can be found in
    // https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
    switch (messageType) {
      case allUrlsMessageType:
        return jed.gettext('Access your data for all websites');
      case domainMessageType:
        return jed.sprintf(
          jed.gettext('Access your data for sites in the %(param)s domain'),
          { param },
        );
      case siteMessageType:
        return jed.sprintf(jed.gettext('Access your data for %(param)s'), {
          param,
        });
      default:
        throw new Error(
          `No matching string found for messageType: ${messageType}`,
        );
    }
  }

  // Generates Permission components for a list of host permissions. If we have 4 or
  // fewer, display them all, otherwise display the first 3 followed by an item
  // that says "...plus N others".
  generateHostPermissions({
    permissions,
    messageType,
  }: GenerateHostPermissionsParams): Array<React.Node> {
    const hostPermissions = [];
    for (const item of permissions) {
      // Add individual Permission components for the first 4 host permissions.
      hostPermissions.push(
        <Permission
          type="hostPermission"
          description={this.getPermissionString({ messageType, param: item })}
          key={item}
        />,
      );
    }
    return hostPermissions;
  }

  render(): React.Node {
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
        log.debug(
          `Host permission string "${permission}" appears to be invalid.`,
        );
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

    const uniqueWildcards = [...new Set(wildcards)];
    const uniqueSites = [...new Set(sites)];

    // Format the host permissions. If we have a wildcard for all urls,
    // a single string will suffice.  Otherwise, show domain wildcards
    // first, then individual host permissions.
    if (allUrls) {
      hostPermissions.push(
        <Permission
          type="hostPermission"
          description={this.getPermissionString({
            messageType: allUrlsMessageType,
          })}
          key="allUrls"
        />,
      );
    } else {
      hostPermissions.push(
        ...this.generateHostPermissions({
          permissions: uniqueWildcards,
          messageType: domainMessageType,
        }),
      );
      hostPermissions.push(
        ...this.generateHostPermissions({
          permissions: uniqueSites,
          messageType: siteMessageType,
        }),
      );
    }
    return <>{hostPermissions}</>;
  }
}

const HostPermissions: React.ComponentType<Props> = compose(translate())(
  HostPermissionsBase,
);

export default HostPermissions;
