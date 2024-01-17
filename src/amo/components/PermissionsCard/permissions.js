/* @flow */
import * as React from 'react';

import log from 'amo/logger';
import HostPermissions from 'amo/components/HostPermissions';
import Permission from 'amo/components/Permission';
import type { AddonFileType } from 'amo/reducers/versions';
import type { I18nType } from 'amo/types/i18n';

export type GetCurrentPermissionsParams = {|
  file: AddonFileType,
|};

/* eslint-disable no-continue */
export class PermissionUtils {
  jed: I18nType;

  permissionStrings: Object;

  constructor(jed: I18nType) {
    this.jed = jed;
    // These should be kept in sync with Firefox's strings for webextension permissions
    // which can be found in
    // https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
    this.permissionStrings = {
      bookmarks: jed.gettext('Read and modify bookmarks'),
      browserSettings: jed.gettext('Read and modify browser settings'),
      browsingData: jed.gettext(
        'Clear recent browsing history, cookies, and related data',
      ),
      clipboardRead: jed.gettext('Get data from the clipboard'),
      clipboardWrite: jed.gettext('Input data to the clipboard'),
      declarativeNetRequest: jed.gettext('Block content on any page'),
      declarativeNetRequestFeedback: jed.gettext('Read your browsing history'),
      devtools: jed.gettext(
        'Extend developer tools to access your data in open tabs',
      ),
      downloads: jed.gettext(
        'Download files and read and modify the browser’s download history',
      ),
      'downloads.open': jed.gettext('Open files downloaded to your computer'),
      find: jed.gettext('Read the text of all open tabs'),
      geolocation: jed.gettext('Access your location'),
      history: jed.gettext('Access browsing history'),
      management: jed.gettext('Monitor extension usage and manage themes'),
      // In Firefox the following message replaces the name "Firefox" with the
      // current brand name, e.g., "Nightly", but we do not need to do that.
      nativeMessaging: jed.gettext(
        'Exchange messages with programs other than Firefox',
      ),
      notifications: jed.gettext('Display notifications to you'),
      pkcs11: jed.gettext('Provide cryptographic authentication services'),
      proxy: jed.gettext('Control browser proxy settings'),
      privacy: jed.gettext('Read and modify privacy settings'),
      sessions: jed.gettext('Access recently closed tabs'),
      tabs: jed.gettext('Access browser tabs'),
      tabHide: jed.gettext('Hide and show browser tabs'),
      topSites: jed.gettext('Access browsing history'),
      unlimitedStorage: jed.gettext(
        'Store unlimited amount of client-side data',
      ),
      webNavigation: jed.gettext('Access browser activity during navigation'),
    };
  }

  // Get lists of optional and required permissions from the correct platform file.
  getCurrentPermissions({ file }: GetCurrentPermissionsParams): {
    optional: Array<string>,
    required: Array<string>,
  } {
    const permissions = {
      optional: [],
      required: [],
    };

    if (!file) {
      log.debug('getCurrentPermissions() called with no file');

      return permissions;
    }

    const hostPermissions = file.host_permissions || [];
    permissions.optional = [...file.optional_permissions, ...hostPermissions];
    permissions.required = file.permissions;
    return permissions;
  }

  // Classify a permission as a host permission or a regular permission.
  classifyPermission(permission: string): {|
    type: 'permissions' | 'hosts',
    value: string,
  |} {
    const match = /^(\w+)(?:\.(\w+)(?:\.\w+)*)?$/.exec(permission);
    let result = { type: 'permissions', value: permission };
    if (!match) {
      result = { type: 'hosts', value: permission };
    }
    return result;
  }

  // Format and sequence all the Permission components.
  formatPermissions(addonPermissions: Array<string>): Array<React.Node> {
    const permissionsToDisplay = [];
    const permissions = { hosts: [], permissions: [] };

    // First, categorize them into host permissions and regular permissions.
    for (const permission of addonPermissions) {
      const { type, value } = this.classifyPermission(permission);
      permissions[type].push(value);
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

    // Next, show remaining permissions, sorted alphabetically by the
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

    // Finally, Add the host permissions.
    if (permissions.hosts.length) {
      permissionsToDisplay.push(
        <HostPermissions permissions={permissions.hosts} />,
      );
    }

    return permissionsToDisplay;
  }
}
