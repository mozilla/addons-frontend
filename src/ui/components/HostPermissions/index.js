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

export class HostPermissionsBase extends React.Component<Props> {
  constructor(props: Props) {
    const { i18n } = props;
    super(props);
    // These should be kept in sync with Firefox's strings for webextention
    // host permissions which can be found in
    // https://hg.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
    this.permissionStrings = {
      allUrls: i18n.gettext('Access your data for all websites'),
      wildcard: (domain) => {
        return i18n.sprintf(
          i18n.gettext('Access your data for sites in the %(domain)s domain'),
          { domain }
        );
      },
      tooManyWildcards: (count) => {
        return i18n.sprintf(i18n.ngettext(
          'Access your data in %(count)s other domain',
          'Access your data in %(count)s other domains',
          count), { count: i18n.formatNumber(count) }
        );
      },
      oneSite: (site) => {
        return i18n.sprintf(
          i18n.gettext('Access your data for %(site)s'),
          { site }
        );
      },
      tooManySites: (count) => {
        return i18n.sprintf(i18n.ngettext(
          'Access your data on %(count)s other site',
          'Access your data on %(count)s other sites',
          count), { count: i18n.formatNumber(count) }
        );
      },
    };
    this.hostPermissions = [];
  }

  permissionStrings: Object;
  hostPermissions: Array<React.Element<typeof Permission>>;

  // Add individual Permission components for individual site/domain permissions.
  formatItems(items: Array<string>, messageType: string) {
    for (const item of items) {
      this.hostPermissions.push(
        <Permission
          type="hostPermission"
          description={this.permissionStrings[messageType](item)}
          key={item}
        />
      );
    }
  }

  // Adds Permission components for a list of host permissions. If we have 4 or
  // fewer, display them all, otherwise display the first 3 followed by an item
  // that says "...plus N others".
  addHostPermissions(
    list: Array<string>,
    singleMessageType:string,
    moreMessageType:string
  ) {
    if (list.length < 5) {
      this.formatItems(list, singleMessageType);
    } else {
      this.formatItems(list.slice(0, 3), singleMessageType);

      const remaining = list.length - 3;
      this.hostPermissions.push(
        <Permission
          type="hostPermission"
          description={this.permissionStrings[moreMessageType](remaining)}
          key={moreMessageType}
        />
      );
    }
  }

  render() {
    const { permissions } = this.props;

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

    // Format the host permissions.  If we have a wildcard for all urls,
    // a single string will suffice.  Otherwise, show domain wildcards
    // first, then individual host permissions.
    if (allUrls) {
      this.hostPermissions.push(
        <Permission
          type="hostPermission"
          description={this.permissionStrings.allUrls}
          key="allUrls"
        />
      );
    } else {
      this.addHostPermissions(wildcards, 'wildcard', 'tooManyWildcards');
      this.addHostPermissions(sites, 'oneSite', 'tooManySites');
    }
    return (
      <React.Fragment>
        {this.hostPermissions}
      </React.Fragment>
    );
  }
}

export default compose(
  translate(),
)(HostPermissionsBase);
