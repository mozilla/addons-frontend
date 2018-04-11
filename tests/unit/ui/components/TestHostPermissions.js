import * as React from 'react';

import {
  fakeI18n, shallowUntilTarget,
} from 'tests/unit/helpers';
import HostPermissions, { HostPermissionsBase } from 'ui/components/HostPermissions';
import Permission from 'ui/components/Permission';


describe(__filename, () => {
  const render = (customProps = {}) => {
    const props = {
      i18n: fakeI18n(),
      permissions: [],
      ...customProps,
    };
    return shallowUntilTarget(
      <HostPermissions {...props} />, HostPermissionsBase
    );
  };

  const expectPermission = (permission, description) => {
    expect(permission).toHaveProp('type', 'hostPermission');
    expect(permission).toHaveProp('description', description);
  };

  it('formats domain permissions', () => {
    const permissions = [
      '*://*.mozilla.org/*',
      '*://*.mozilla.com/*',
      '*://*.mozilla.ca/*',
      '*://*.mozilla.us/*',
      '*://*.mozilla.co.nz/*',
      '*://*.mozilla.co.uk/*',
    ];
    const root = render({ permissions });
    expect(root.find(Permission)).toHaveLength(4);
    expectPermission(root.childAt(0),
      'Access your data for sites in the mozilla.org domain');
    expectPermission(root.childAt(1),
      'Access your data for sites in the mozilla.com domain');
    expectPermission(root.childAt(2),
      'Access your data for sites in the mozilla.ca domain');
    expectPermission(root.childAt(3),
      'Access your data in 3 other domains');
  });

  it('formats site permissions', () => {
    const permissions = [
      '*://developer.mozilla.org/*',
      '*://addons.mozilla.org/*',
      '*://www.mozilla.org/*',
      '*://testing.mozilla.org/*',
      '*://awesome.mozilla.org/*',
    ];
    const root = render({ permissions });
    expect(root.find(Permission)).toHaveLength(4);
    expectPermission(root.childAt(0),
      'Access your data for developer.mozilla.org');
    expectPermission(root.childAt(1),
      'Access your data for addons.mozilla.org');
    expectPermission(root.childAt(2), 'Access your data for www.mozilla.org');
    expectPermission(root.childAt(3), 'Access your data on 2 other sites');
  });

  it('returns a single host permission for all urls', () => {
    const permissions = [
      '*://*.mozilla.com/*',
      '*://developer.mozilla.org/*',
    ];
    for (const allUrlsPermission of ['<all_urls>', '*://*/']) {
      const root = render({
        permissions: [
          ...permissions,
          allUrlsPermission,
        ],
      });
      expect(root.find(Permission)).toHaveLength(1);
      expectPermission(root.childAt(0), 'Access your data for all websites');
    }
  });

  it('does not return a host permission for moz-extension: urls', () => {
    const root = render({
      permissions: ['moz-extension://should/not/generate/a/permission/'],
    });
    expect(root.find(Permission)).toHaveLength(0);
  });

  it('does not return a host permission for an invalid pattern', () => {
    const root = render({ permissions: ['*'] });
    expect(root.find(Permission)).toHaveLength(0);
  });
});
