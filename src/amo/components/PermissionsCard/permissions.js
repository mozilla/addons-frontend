/* @flow */
import { oneLineTrim } from 'common-tags';
import * as React from 'react';

import log from 'core/logger';
import { OS_ALL } from 'core/constants';
import { userAgentOSToPlatform } from 'core/installAddon';
import type { AddonType } from 'core/types/addons';
import type { UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import Permission from 'ui/components/Permission';

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
      browsingData: i18n.gettext('Clear recent browsing history, cookies, and related data'),
      clipboardRead: i18n.gettext('Get data from the clipboard'),
      clipboardWrite: i18n.gettext('Input data to the clipboard'),
      devtools: i18n.gettext('Extend developer tools to access your data in open tabs'),
      downloads: i18n.gettext('Download files and read and modify the browser’s download history'),
      'downloads.open': i18n.gettext('Open files downloaded to your computer'),
      find: i18n.gettext('Read the text of all open tabs'),
      geolocation: i18n.gettext('Access your location'),
      history: i18n.gettext('Access browsing history'),
      management: i18n.gettext('Monitor extension usage and manage themes'),
      // In Firefox the following message replaces the name "Firefox" with the
      // current brand name, e.g., "Nightly", but we do not need to do that.
      nativeMessaging: i18n.gettext('Exchange messages with programs other than Firefox'),
      notifications: i18n.gettext('Display notifications to you'),
      pkcs11: i18n.gettext('Provide cryptographic authentication services'),
      proxy: i18n.gettext('Control browser proxy setting'),
      privacy: i18n.gettext('Read and modify privacy settings'),
      sessions: i18n.gettext('Access recently closed tabs'),
      tabs: i18n.gettext('Access browser tabs'),
      tabHide: i18n.gettext('Hide and show browser tabs'),
      topSites: i18n.gettext('Access browsing history'),
      unlimitedStorage: i18n.gettext('Store unlimited amount of client-side data'),
      webNavigation: i18n.gettext('Access browser activity during navigation'),
      allUrls: i18n.gettext('Access your data for all websites'),
      wildcard: (domain) => {
        return i18n.sprintf(
          i18n.gettext('Access your data for sites in the %(domain)s domain'),
          { domain }
        );
      },
      // Note that we do not need to use ngettext for this as count will never
      // be less than 2.
      tooManyWildcards: (count) => {
        return i18n.sprintf(
          i18n.gettext('Access your data in %(count)s other domains'),
          { count: i18n.formatNumber(count) },
        );
      },
      oneSite: (site) => {
        return i18n.sprintf(
          i18n.gettext('Access your data for %(site)s'),
          { site }
        );
      },
      // Note that we do not need to use ngettext for this as count will never
      // be less than 2.
      tooManySites: (count) => {
        return i18n.sprintf(
          i18n.gettext('Access your data on %(count)s other sites'),
          { count: i18n.formatNumber(count) },
        );
      },
    };
  }

  // Get a list of permissions from the correct platform file.
  getCurrentPermissions(
    addon: AddonType,
    userAgentInfo: UserAgentInfoType
  ): Array<string> {
    const agentOsName =
      userAgentInfo.os.name && userAgentInfo.os.name.toLowerCase();
    const platform = userAgentOSToPlatform[agentOsName];

    if (!platform) {
      log.debug(`No platform exists for user agent OS "${agentOsName}"`);
      return [];
    }

    const file = addon.platformFiles[platform] || addon.platformFiles[OS_ALL];

    if (!file) {
      log.debug(oneLineTrim`No file exists for platform "${agentOsName}"
        (mapped to "${platform}"); platform files:`, addon.platformFiles);
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
  formatPermissions(addonPermissions: Array<string>): Array<Object> {
    const permissionsToDisplay = [];
    const permissions = { hosts: [], permissions: [] };

    // First, categorize them into host permissions and regular permissions.
    for (const permission of addonPermissions) {
      const { type, value } = this.classifyPermission(permission);
      permissions[type].push(value);
    }

    // Classify the host permissions.
    let allUrls = false;
    const wildcards = [];
    const sites = [];
    for (const permission of permissions.hosts) {
      if (permission === '<all_urls>') {
        allUrls = true;
        break;
      }
      if (permission.startsWith('moz-extension:')) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const match = /^[a-z*]+:\/\/([^/]+)\//.exec(permission);
      if (!match) {
        log.debug(`Host permission string "${permission}" appears to be invalid.`);
        // eslint-disable-next-line no-continue
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

    // Format the host permissions.  If we have a wildcard for all urls,
    // a single string will suffice.  Otherwise, show domain wildcards
    // first, then individual host permissions.

    if (allUrls) {
      permissionsToDisplay.push(
        <Permission
          className="hostPermission"
          description={this.permissionStrings.allUrls}
          key="allUrls"
        />
      );
    } else {
      // Formats a list of host permissions.  If we have 4 or fewer, display
      // them all, otherwise display the first 3 followed by an item that
      // says "...plus N others".
      const formatHostPermissions = (list, itemKey, moreKey) => {
        const formatItems = (items) => {
          permissionsToDisplay.push(...items.map((item) => {
            return (
              <Permission
                className="hostPermission"
                description={this.permissionStrings[itemKey](item)}
                key={item}
              />
            );
          }));
        };
        if (list.length < 5) {
          formatItems(list);
        } else {
          formatItems(list.slice(0, 3));

          const remaining = list.length - 3;
          permissionsToDisplay.push(
            <Permission
              className="hostPermission"
              description={this.permissionStrings[moreKey](remaining)}
              key={moreKey}
            />
          );
        }
      };

      formatHostPermissions(wildcards, 'wildcard', 'tooManyWildcards');
      formatHostPermissions(sites, 'oneSite', 'tooManySites');
    }

    // Next, show the native messaging permission if it is present.
    const nativeMessagingPermission = 'nativeMessaging';
    if (permissions.permissions.includes(nativeMessagingPermission)) {
      permissionsToDisplay.push(
        <Permission
          className={nativeMessagingPermission}
          description={this.permissionStrings[nativeMessagingPermission]}
          key={nativeMessagingPermission}
        />
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
            className={permission}
            description={this.permissionStrings[permission]}
            key={permission}
          />
        );
      }
    }
    return permissionsToDisplay;
  }
}
