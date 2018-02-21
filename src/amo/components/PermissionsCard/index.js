/* @flow */
import { oneLine } from 'common-tags';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import log from 'core/logger';
import { OS_ALL } from 'core/constants';
import translate from 'core/i18n/translate';
import { userAgentOSToPlatform } from 'core/installAddon';
import type { AddonType } from 'core/types/addons';
import type { ApiStateType, UserAgentInfoType } from 'core/reducers/api';
import type { I18nType } from 'core/types/i18n';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import Permission from 'ui/components/Permission';

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

    // These should be kept in sync with Firefox's strings for webextention permissions
    // which can be found in
    // https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
    const permissionStrings = {
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
      tooManySites: (count) => {
        return i18n.sprintf(
          i18n.gettext('Access your data on %(count)s other sites'),
          { count: i18n.formatNumber(count) },
        );
      },
    };

    // Classify a permission as a host permission or a regular permission.
    function classifyPermission(permission) {
      const match = /^(\w+)(?:\.(\w+)(?:\.\w+)*)?$/.exec(permission);
      let result = { type: 'permissions', value: permission };
      if (!match) {
        result = { type: 'hosts', value: permission };
      }
      return result;
    }

    const permissionsToDisplay = [];

    // Format and sequence all the Permission components.
    function formatPermissions(addonPermissions) {
      const permissions = { hosts: [], permissions: [] };

      // First, categorize them into host permissions and regular permissions.
      // eslint-disable-next-line no-restricted-syntax
      for (const permission of addonPermissions) {
        const { type, value } = classifyPermission(permission);
        permissions[type].push(value);
      }

      // Classify the host permissions.
      let allUrls = false;
      const wildcards = [];
      const sites = [];
      // eslint-disable-next-line no-restricted-syntax
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
            description={permissionStrings.allUrls}
            key="allUrls"
          />
        );
      } else {
        // Formats a list of host permissions.  If we have 4 or fewer, display
        // them all, otherwise display the first 3 followed by an item that
        // says "...plus N others".
        const formatHostPermissions = (list, itemKey, moreKey) => {
          function formatItems(items) {
            permissionsToDisplay.push(...items.map((item) => {
              return (
                <Permission
                  className="hostPermission"
                  description={permissionStrings[itemKey](item)}
                  key={item}
                />
              );
            }));
          }
          if (list.length < 5) {
            formatItems(list);
          } else {
            formatItems(list.slice(0, 3));

            const remaining = list.length - 3;
            permissionsToDisplay.push(
              <Permission
                className="hostPermission"
                description={permissionStrings[moreKey](remaining)}
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
            description={permissionStrings[nativeMessagingPermission]}
            key={nativeMessagingPermission}
          />
        );
      }

      // Finally, show remaining permissions, sorted alphabetically by the
      // permission string to match Firefox.
      const permissionsCopy = permissions.permissions.slice(0);
      // eslint-disable-next-line no-restricted-syntax
      for (const permission of permissionsCopy.sort()) {
        // nativeMessaging is handled above.
        if (permission === 'nativeMessaging') {
          // eslint-disable-next-line no-continue
          continue;
        }
        // Only output a permission if we have a string defined for it.
        if (permissionStrings[permission]) {
          permissionsToDisplay.push(
            <Permission
              className={permission}
              description={permissionStrings[permission]}
              key={permission}
            />
          );
        }
      }
      return permissionsToDisplay;
    }

    // Get the permission strings from the appropriate file object.
    const agentOsName =
      userAgentInfo.os.name && userAgentInfo.os.name.toLowerCase();
    const platform = userAgentOSToPlatform[agentOsName];
    const file = addon.platformFiles[platform] || addon.platformFiles[OS_ALL];

    if (!file) {
      log.debug(oneLine`No file exists for platform "${agentOsName}"
        (mapped to "${platform}"); platform files:`, addon.platformFiles);
      return [];
    }

    const addonPermissions = file.permissions;
    if (!addonPermissions.length) {
      return null;
    }

    const content = formatPermissions(addonPermissions);
    if (!content.length) {
      return null;
    }

    return (
      <Card
        header={i18n.gettext('Permissions')}
        className="PermissionsCard"
      >
        <div className="PermissionsCard-subhead">{i18n.gettext('This add-on can:')}</div>
        <ul className="PermissionsCard-list">
          {content}
        </ul>
        <Button
          buttonType="neutral"
          className="PermissionCard-learn-more"
          href="https://support.mozilla.org/en-US/kb/permission-request-messages-firefox-extensions"
          external
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

export default compose(
  connect(mapStateToProps),
  translate(),
)(PermissionsCardBase);
