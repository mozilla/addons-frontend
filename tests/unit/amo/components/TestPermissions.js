import createPermissionUtils from 'amo/components/PermissionsCard/permissions';
import { createInternalAddon } from 'core/reducers/addons';
import {
  OS_ALL,
  OS_MAC,
} from 'core/constants';
import {
  USER_AGENT_OS_MAC,
  USER_AGENT_OS_WINDOWS,
} from 'core/reducers/api';
import {
  fakeI18n,
} from 'tests/unit/helpers';
import {
  createFakeAddon,
  fakePlatformFile,
} from 'tests/unit/amo/helpers';

describe('Permissions module', () => {
  let permissionUtils;

  beforeEach(() => {
    permissionUtils = createPermissionUtils(fakeI18n());
  });

  describe('getCurrentPermissions', () => {
    const createAddon = (platforms = [OS_MAC, OS_ALL]) => {
      const files = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const platform of platforms) {
        files.push(
          {
            ...fakePlatformFile,
            platform,
            permissions: [platform],
          },
        );
      }
      return createInternalAddon(createFakeAddon({ files }));
    };

    const fakeUserAgent = (osName) => {
      return { os: { name: osName } };
    };

    it('gets permissions for a specific os', () => {
      const result = permissionUtils.getCurrentPermissions(
        createAddon(), fakeUserAgent(USER_AGENT_OS_MAC)
      );
      expect(result).toContain(OS_MAC);
    });

    it('gets permissions for a all_os if the specific platform is not found', () => {
      const result = permissionUtils.getCurrentPermissions(
        createAddon(), fakeUserAgent(USER_AGENT_OS_WINDOWS)
      );
      expect(result).toContain(OS_ALL);
    });

    it('returns an empty array if all_os does not exist and the platform is not found', () => {
      const result = permissionUtils.getCurrentPermissions(
        createAddon([OS_MAC]), fakeUserAgent(USER_AGENT_OS_WINDOWS)
      );
      expect(result).toHaveLength(0);
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
      // eslint-disable-next-line no-restricted-syntax
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
    const expectPermission = (permission, className, description) => {
      expect(permission.props.className).toEqual(className);
      expect(permission.props.description).toEqual(description);
    };

    const expectHostPermission = (permission, description) => {
      expectPermission(permission, 'hostPermission', description);
    };

    it('formats domain permissions', () => {
      const testPermissions = [
        '*://*.mozilla.org/*',
        '*://*.mozilla.com/*',
        '*://*.mozilla.ca/*',
        '*://*.mozilla.us/*',
        '*://*.mozilla.co.nz/*',
        '*://*.mozilla.co.uk/*',
      ];
      const result = permissionUtils.formatPermissions(testPermissions);
      expect(result).toHaveLength(4);
      expectHostPermission(result[0], 'Access your data for sites in the mozilla.org domain');
      expectHostPermission(result[1], 'Access your data for sites in the mozilla.com domain');
      expectHostPermission(result[2], 'Access your data for sites in the mozilla.ca domain');
      expectHostPermission(result[3], 'Access your data in 3 other domains');
    });

    it('formats site permissions', () => {
      const testPermissions = [
        '*://developer.mozilla.org/*',
        '*://addons.mozilla.org/*',
        '*://www.mozilla.org/*',
        '*://testing.mozilla.org/*',
        '*://awesome.mozilla.org/*',
      ];
      const result = permissionUtils.formatPermissions(testPermissions);
      expect(result).toHaveLength(4);
      expectHostPermission(result[0], 'Access your data for developer.mozilla.org');
      expectHostPermission(result[1], 'Access your data for addons.mozilla.org');
      expectHostPermission(result[2], 'Access your data for www.mozilla.org');
      expectHostPermission(result[3], 'Access your data on 2 other sites');
    });

    it('returns a single host permission for all urls', () => {
      const testPermissions = [
        '*://*.mozilla.com/*',
        '*://developer.mozilla.org/*',
        '<all_urls>',
      ];
      const result = permissionUtils.formatPermissions(testPermissions);
      expect(result).toHaveLength(1);
      expectHostPermission(result[0], 'Access your data for all websites');
    });

    it('returns all permissions in the expected order', () => {
      const testPermissions = [
        'tabs',
        '*://developer.mozilla.org/*',
        'nativeMessaging',
        '*://*.mozilla.com/*',
        'bookmarks',
      ];
      const result = permissionUtils.formatPermissions(testPermissions);
      expect(result).toHaveLength(5);
      // Domains first.
      expectHostPermission(result[0], 'Access your data for sites in the mozilla.com domain');
      // Sites next.
      expectHostPermission(result[1], 'Access your data for developer.mozilla.org');
      // Native messaging next.
      expectPermission(result[2], 'nativeMessaging', 'Exchange messages with programs other than Firefox');
      // Names permissions in alphabetical order.
      expectPermission(result[3], 'bookmarks', 'Read and modify bookmarks');
      expectPermission(result[4], 'tabs', 'Access browser tabs');
    });
  });
});
