import * as React from 'react';

import PermissionsCard, {
  PermissionsCardBase,
} from 'amo/components/PermissionsCard';
import { createInternalVersion } from 'core/reducers/versions';
import {
  dispatchClientMetadata,
  fakeI18n,
  fakePlatformFile,
  fakeVersion,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Button from 'ui/components/Button';
import Permission from 'ui/components/Permission';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const createVersionWithPermissions = (permissions) => {
    return createInternalVersion({
      ...fakeVersion,
      files: [
        {
          ...fakePlatformFile,
          permissions,
        },
      ],
    });
  };

  function render(props = {}) {
    return shallowUntilTarget(
      <PermissionsCard
        version={props.version || createInternalVersion(fakeVersion)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      PermissionsCardBase,
    );
  }

  describe('no permissions', () => {
    it('renders nothing without a version', () => {
      const root = render({ version: null });
      expect(root).not.toHaveClassName('PermissionsCard');
    });

    it('renders nothing for a version with no permissions', () => {
      const root = render({ version: createVersionWithPermissions([]) });
      expect(root).not.toHaveClassName('PermissionsCard');
    });

    it('renders nothing for a version with no displayable permissions', () => {
      const root = render({
        version: createVersionWithPermissions(['activeTab']),
      });
      expect(root).not.toHaveClassName('PermissionsCard');
    });
  });

  describe('with permissions', () => {
    it('renders itself', () => {
      const permission = 'bookmarks';
      const root = render({
        version: createVersionWithPermissions([permission]),
      });
      expect(root).toHaveClassName('PermissionsCard');
      expect(root.find('p')).toHaveClassName('PermissionsCard-subhead');
      expect(root.find('ul')).toHaveClassName('PermissionsCard-list');
      expect(root.find(Button)).toHaveClassName('PermissionCard-learn-more');
      expect(root.find(Button)).toHaveProp('externalDark', true);
      expect(root.find(Permission)).toHaveProp('type', permission);
    });
  });
});
