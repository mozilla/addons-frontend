/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import log from 'core/logger';
import translate from 'core/i18n/translate';
import type { I18nType } from 'core/types/i18n';
import Permission from 'ui/components/Permission';

/* eslint-disable no-continue */
type Props = {|
  permissions: Array<string>,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

const domainMessageType: 'domainMessageType' = 'domainMessageType';
const siteMessageType: 'siteMessageType' = 'siteMessageType';
const allUrlsMessageType: 'allUrlsMessageType' = 'allUrlsMessageType';

type HostPermissionMessageType = 'domainMessageType' | 'siteMessageType';
type PermissionMessageType = HostPermissionMessageType | 'allUrlsMessageType';

type GetPermissionStringParams = {|
  messageType: PermissionMessageType,
  param?: string | number,
  multiple?: boolean,
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
    multiple = false,
  }: GetPermissionStringParams): string {
    const { i18n } = this.props;

    const paramNumber = parseInt(param, 10);

    // These should be kept in sync with Firefox's strings for webextension
    // host permissions which can be found in
    // https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
    switch (messageType) {
      case allUrlsMessageType:
        return i18n.gettext('Access your data for all websites');
      case domainMessageType:
        if (multiple) {
          return i18n.sprintf(
            i18n.ngettext(
              'Access your data in %(param)s other domain',
              'Access your data in %(param)s other domains',
              paramNumber,
            ),
            { param: i18n.formatNumber(paramNumber) },
          );
        }
        return i18n.sprintf(
          i18n.gettext('Access your data for sites in the %(param)s domain'),
          { param },
        );
      case siteMessageType:
        if (multiple) {
          return i18n.sprintf(
            i18n.ngettext(
              'Access your data on %(param)s other site',
              'Access your data on %(param)s other sites',
              paramNumber,
            ),
            { param: i18n.formatNumber(paramNumber) },
          );
        }
        return i18n.sprintf(i18n.gettext('Access your data for %(param)s'), {
          param,
        });
      default:
        throw new Error(
          `No matching string found for messageType: ${messageType}`,
        );
    }
  }

  i18n: I18nType;

  // Generates Permission components for a list of host permissions. If we have 4 or
  // fewer, display them all, otherwise display the first 3 followed by an item
  // that says "...plus N others".
  generateHostPermissions({
    permissions,
    messageType,
  }: GenerateHostPermissionsParams): Array<React.Element<typeof Permission>> {
    const hostPermissions = [];
    for (const item of permissions.slice(0, 4)) {
      // Add individual Permission components for the first 4 host permissions.
      hostPermissions.push(
        <Permission
          type="hostPermission"
          description={this.getPermissionString({ messageType, param: item })}
          key={item}
        />,
      );
    }
    if (permissions.length > 4) {
      // Replace the final individual permission with a "too many" permission.
      hostPermissions[3] = (
        <Permission
          type="hostPermission"
          description={this.getPermissionString({
            messageType,
            param: permissions.length - 3,
            multiple: true,
          })}
          key={messageType}
        />
      );
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
