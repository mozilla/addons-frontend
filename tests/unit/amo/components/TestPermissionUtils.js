import UAParser from 'ua-parser-js';

import { PermissionUtils } from 'amo/components/PermissionsCard/permissions';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon, fakeI18n, userAgentsByPlatform } from 'tests/unit/helpers';

describe(__filename, () => {
  let permissionUtils;

  beforeEach(() => {
    permissionUtils = new PermissionUtils(fakeI18n());
  });

  describe('getCurrentPermissions', () => {
    let findFileForPlatformStub;

    beforeEach(() => {
      findFileForPlatformStub = sinon.stub();
    });

    it('returns permissions from a found file', () => {
      const permissions = ['bookmarks'];
      findFileForPlatformStub.returns({ permissions });

      const returnedPermissions = permissionUtils.getCurrentPermissions(
        createInternalAddon(fakeAddon),
        UAParser(userAgentsByPlatform.mac.firefox57),
        findFileForPlatformStub,
      );

      expect(returnedPermissions).toEqual(permissions);
    });

    it('returns an empty array if no file was found', () => {
      findFileForPlatformStub.returns(undefined);

      const returnedPermissions = permissionUtils.getCurrentPermissions(
        createInternalAddon(fakeAddon),
        UAParser(userAgentsByPlatform.mac.firefox57),
        findFileForPlatformStub,
      );

      expect(returnedPermissions).toEqual([]);
    });

    it('returns an empty array if no permissions were found', () => {
      findFileForPlatformStub.returns({ permissions: undefined });

      const returnedPermissions = permissionUtils.getCurrentPermissions(
        createInternalAddon(fakeAddon),
        UAParser(userAgentsByPlatform.mac.firefox57),
        findFileForPlatformStub,
      );

      expect(returnedPermissions).toEqual([]);
    });
  });

  describe('classifyPermission', () => {
    it('classifies all_urls host permission', () => {
      const result = permissionUtils.classifyPermission('<all_urls>');
      expect(result).toEqual({ type: 'hosts', value: '<all_urls>' });
    });

    it('classifies host permissions', () => {
      // These sample match patterns are taken from
      // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Match_patterns
      const testPermissions = [
        '*://*.mozilla.org/*',
        '*://mozilla.org/',
        'http://mozilla.org/',
        'https://*/path',
        'https://*/path/',
        'https://mozilla.org/*',
        'https://mozilla.org/a/b/c/',
        'https://mozilla.org/*/b/*/',
      ];
      for (const permission of testPermissions) {
        const result = permissionUtils.classifyPermission(permission);
        expect(result).toEqual({ type: 'hosts', value: permission });
      }
    });

    it('classifies named permissions', () => {
      const result = permissionUtils.classifyPermission('bookmarks');
      expect(result).toEqual({ type: 'permissions', value: 'bookmarks' });
    });
  });

  describe('formatPermissions', () => {
    const expectPermission = (permission, type, description) => {
      expect(permission.props.type).toEqual(type);
      expect(permission.props.description).toEqual(description);
    };

    it('returns all permissions in the expected order', () => {
      const hostPermissionA = '*://developer.mozilla.org/*';
      const hostPermissionB = '*://*.mozilla.com/*';
      const testPermissions = [
        'tabs',
        hostPermissionA,
        'nativeMessaging',
        hostPermissionB,
        'bookmarks',
      ];

      const result = permissionUtils.formatPermissions(testPermissions);
      expect(result).toHaveLength(4);

      // HostPermissions component.
      expect(result[0].props.permissions).toHaveLength(2);
      expect(result[0].props.permissions).toEqual([
        hostPermissionA,
        hostPermissionB,
      ]);
      // Native messaging next.
      expectPermission(
        result[1],
        'nativeMessaging',
        'Exchange messages with programs other than Firefox',
      );
      // Named permissions in alphabetical order.
      expectPermission(result[2], 'bookmarks', 'Read and modify bookmarks');
      expectPermission(result[3], 'tabs', 'Access browser tabs');
    });
  });
});
