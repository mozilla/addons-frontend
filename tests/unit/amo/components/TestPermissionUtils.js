import { PermissionUtils } from 'amo/components/PermissionsCard/permissions';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  let permissionUtils;

  beforeEach(() => {
    permissionUtils = new PermissionUtils(fakeI18n());
  });

  describe('getCurrentPermissions', () => {
    const _getCurrentPermissions = ({ file } = {}) => {
      return permissionUtils.getCurrentPermissions({
        file,
      });
    };

    it('returns permissions from file', () => {
      const optionalPermissions = ['webRequest'];
      const permissions = ['bookmarks'];

      const file = {
        optional_permissions: optionalPermissions,
        permissions,
      };

      expect(_getCurrentPermissions({ file })).toEqual({
        optional: optionalPermissions,
        required: permissions,
      });
    });

    it('puts host_permissions after optional permissions', () => {
      const hostPermissions = ['*://example.com/*'];
      const optionalPermissions = ['webRequest'];
      const permissions = ['bookmarks'];

      const file = {
        host_permissions: hostPermissions,
        optional_permissions: optionalPermissions,
        permissions,
      };

      expect(_getCurrentPermissions({ file })).toEqual({
        optional: [...optionalPermissions, ...hostPermissions],
        required: permissions,
      });
    });

    it('returns empty arrays if no file was found', () => {
      const file = null;
      expect(_getCurrentPermissions({ file })).toEqual({
        optional: [],
        required: [],
      });
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

      // Native messaging next.
      expect(result[0].props.description).toEqual(
        'Exchange messages with programs other than Firefox',
      );
      // Named permissions in alphabetical order.
      expect(result[1].props.description).toEqual('Read and modify bookmarks');
      expect(result[2].props.description).toEqual('Access browser tabs');
      // HostPermissions component.
      expect(result[3].props.permissions).toEqual([
        hostPermissionA,
        hostPermissionB,
      ]);
    });
  });
});
