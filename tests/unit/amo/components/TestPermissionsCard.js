import * as React from 'react';

import PermissionsCard, {
  PermissionsCardBase,
} from 'amo/components/PermissionsCard';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeAddon,
  dispatchClientMetadata,
  fakeAddon,
  fakePlatformFile,
} from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';
import Button from 'ui/components/Button';
import Permission from 'ui/components/Permission';


describe('PermissionsCard component', () => {
  const { store } = dispatchClientMetadata();
  const createAddonWithPermissions = (permissions) => {
    return createInternalAddon(createFakeAddon({
      files: [{
        ...fakePlatformFile,
        permissions,
      }],
    }));
  };

  function render(props = {}) {
    return shallowUntilTarget(
      <PermissionsCard
        addon={props.addon || createInternalAddon(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      PermissionsCardBase
    );
  }

  describe('no permissions', () => {
    it('renders nothing without an addon', () => {
      const root = render({ addon: null });
      expect(root.find('.PermissionsCard')).toHaveLength(0);
    });

    it('renders nothing for an addon with no permissions', () => {
      const addon = createAddonWithPermissions([]);
      const root = render({ addon });
      expect(root.find('.PermissionsCard')).toHaveLength(0);
    });

    it('renders nothing for an addon with no displayable permissions', () => {
      const root = render();
      expect(root.find('.PermissionsCard')).toHaveLength(0);
    });
  });

  describe('with permissions', () => {
    const expectPermission = (permission, className, description) => {
      expect(permission).toHaveProp('className', className);
      expect(permission).toHaveProp('description', description);
    };

    const expectHostPermission = (permission, description) => {
      expectPermission(permission, 'hostPermission', description);
    };

    it('renders itself', () => {
      const root = render({
        addon: createAddonWithPermissions(['bookmarks']),
      });
      expect(root.find('.PermissionsCard')).toHaveLength(1);
      expect(root.find('.PermissionsCard-subhead')).toHaveLength(1);
      expect(root.find('.PermissionsCard-list')).toHaveLength(1);
      expect(root.find(Button)).toHaveProp('className', 'PermissionCard-learn-more');
    });

    it('renders host permissions for domains', () => {
      const root = render({
        addon: createAddonWithPermissions([
          '*://*.mozilla.org/*',
          '*://*.mozilla.com/*',
          '*://*.mozilla.ca/*',
          '*://*.mozilla.us/*',
          '*://*.mozilla.co.nz/*',
          '*://*.mozilla.co.uk/*',
        ]),
      });
      const items = root.find(Permission);
      expect(items).toHaveLength(4);

      expectHostPermission(items.at(0), 'Access your data for sites in the mozilla.org domain');
      expectHostPermission(items.at(1), 'Access your data for sites in the mozilla.com domain');
      expectHostPermission(items.at(2), 'Access your data for sites in the mozilla.ca domain');
      expectHostPermission(items.at(3), 'Access your data in 3 other domains');
    });

    it('renders host permissions for sites', () => {
      const root = render({
        addon: createAddonWithPermissions([
          '*://developer.mozilla.org/*',
          '*://addons.mozilla.org/*',
          '*://www.mozilla.org/*',
          '*://testing.mozilla.org/*',
          '*://awesome.mozilla.org/*',
        ]),
      });
      const items = root.find(Permission);
      expect(items).toHaveLength(4);

      expectHostPermission(items.at(0), 'Access your data for developer.mozilla.org');
      expectHostPermission(items.at(1), 'Access your data for addons.mozilla.org');
      expectHostPermission(items.at(2), 'Access your data for www.mozilla.org');
      expectHostPermission(items.at(3), 'Access your data on 2 other sites');
    });

    it('renders a single host permission for all urls', () => {
      const root = render({
        addon: createAddonWithPermissions([
          '*://*.mozilla.com/*',
          '*://developer.mozilla.org/*',
          '<all_urls>',
        ]),
      });
      const items = root.find(Permission);
      expect(items).toHaveLength(1);

      expectHostPermission(items.at(0), 'Access your data for all websites');
    });

    it('renders all permissions in the expected order', () => {
      const root = render({
        addon: createAddonWithPermissions([
          'tabs',
          '*://developer.mozilla.org/*',
          'nativeMessaging',
          '*://*.mozilla.com/*',
          'bookmarks',
        ]),
      });
      const items = root.find(Permission);
      expect(items).toHaveLength(5);

      // Domains first.
      expectHostPermission(items.at(0), 'Access your data for sites in the mozilla.com domain');
      // Sites next.
      expectHostPermission(items.at(1), 'Access your data for developer.mozilla.org');
      // Native messaging next.
      expectPermission(items.at(2), 'nativeMessaging', 'Exchange messages with programs other than Firefox');
      // Names permissions in alphabetical order.
      expectPermission(items.at(3), 'bookmarks', 'Read and modify bookmarks');
      expectPermission(items.at(4), 'tabs', 'Access browser tabs');
    });
  });
});
