/* @flow */
import * as React from 'react';

import log from 'core/logger';
import { findFileForPlatform } from 'core/utils';
import HostPermissions from 'ui/components/HostPermissions';
import Permission from 'ui/components/Permission';
import type { PlatformFilesType } from 'core/types/addons';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';

export type GetCurrentPermissionsParams = {|
  platformFiles: PlatformFilesType,
  userAgentInfo: UserAgentInfoType,
  _findFileForPlatform?: typeof findFileForPlatform,
|};

/* eslint-disable no-continue */
export class PermissionUtils {
  i18n: I18nType;

  permissionStrings: Object;

  constructor(i18n: I18nType) {
    this.i18n = i18n;
    // These should be kept in sync with Firefox's strings for webextention permissions
    // which can be found in
    // https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
    this.permissionStrings = {
      bookmarks: i18n.gettext('Read and modify bookmarks'),
      browserSettings: i18n.gettext('Read and modify browser settings'),
      browsingData: i18n.gettext(
        'Clear recent browsing history, cookies, and related data',
      ),
      clipboardRead: i18n.gettext('Get data from the clipboard'),
      clipboardWrite: i18n.gettext('Input data to the clipboard'),
      devtools: i18n.gettext(
        'Extend developer tools to access your data in open tabs',
      ),
      downloads: i18n.gettext(
        'Download files and read and modify the browser’s download history',
      ),
      'downloads.open': i18n.gettext('Open files downloaded to your computer'),
      find: i18n.gettext('Read the text of all open tabs'),
      geolocation: i18n.gettext('Access your location'),
      history: i18n.gettext('Access browsing history'),
      management: i18n.gettext('Monitor extension usage and manage themes'),
      // In Firefox the following message replaces the name "Firefox" with the
      // current brand name, e.g., "Nightly", but we do not need to do that.
      nativeMessaging: i18n.gettext(
        'Exchange messages with programs other than Firefox',
      ),
      notifications: i18n.gettext('Display notifications to you'),
      pkcs11: i18n.gettext('Provide cryptographic authentication services'),
      proxy: i18n.gettext('Control browser proxy settings'),
      privacy: i18n.gettext('Read and modify privacy settings'),
      sessions: i18n.gettext('Access recently closed tabs'),
      tabs: i18n.gettext('Access browser tabs'),
      tabHide: i18n.gettext('Hide and show browser tabs'),
      topSites: i18n.gettext('Access browsing history'),
      unlimitedStorage: i18n.gettext(
        'Store unlimited amount of client-side data',
      ),
      webNavigation: i18n.gettext('Access browser activity during navigation'),
    };
  }

  // Get a list of permissions from the correct platform file.
  getCurrentPermissions({
    platformFiles,
    userAgentInfo,
    _findFileForPlatform = findFileForPlatform,
  }: GetCurrentPermissionsParams): Array<string> {
    const file = _findFileForPlatform({
      userAgentInfo,
      platformFiles,
    });

    if (!file) {
      log.debug(
        `No file exists for os "${userAgentInfo.os.toString()}"; platform files:`,
        platformFiles,
      );
      return [];
    }
    return file.permissions || [];
  }

  // Classify a permission as a host permission or a regular permission.
  classifyPermission(
    permission: string,
  ): {| type: 'permissions' | 'hosts', value: string |} {
    const match = /^(\w+)(?:\.(\w+)(?:\.\w+)*)?$/.exec(permission);
    let result = { type: 'permissions', value: permission };
    if (!match) {
      result = { type: 'hosts', value: permission };
    }
    return result;
  }

  // Format and sequence all the Permission components.
  formatPermissions(
    addonPermissions: Array<string>,
  ): Array<React.Element<typeof HostPermissions | typeof Permission>> {
    const permissionsToDisplay = [];
    const permissions = { hosts: [], permissions: [] };

    // First, categorize them into host permissions and regular permissions.
    for (const permission of addonPermissions) {
      const { type, value } = this.classifyPermission(permission);
      permissions[type].push(value);
    }

    // Add the host permissions.
    if (permissions.hosts.length) {
      permissionsToDisplay.push(
        <HostPermissions permissions={permissions.hosts} />,
      );
    }

    // Next, show the native messaging permission if it is present.
    const nativeMessagingPermission = 'nativeMessaging';
    if (permissions.permissions.includes(nativeMessagingPermission)) {
      permissionsToDisplay.push(
        <Permission
          type={nativeMessagingPermission}
          description={this.permissionStrings[nativeMessagingPermission]}
          key={nativeMessagingPermission}
        />,
      );
    }

    // Finally, show remaining permissions, sorted alphabetically by the
    // permission string to match Firefox.
    const permissionsCopy = permissions.permissions.slice(0);
    for (const permission of permissionsCopy.sort()) {
      // nativeMessaging is handled above.
      if (permission === 'nativeMessaging') {
        // eslint-disable-next-line no-continue
        continue;
      }
      // Only output a permission if we have a string defined for it.
      if (this.permissionStrings[permission]) {
        permissionsToDisplay.push(
          <Permission
            type={permission}
            description={this.permissionStrings[permission]}
            key={permission}
          />,
        );
      }
    }
    return permissionsToDisplay;
  }
}
