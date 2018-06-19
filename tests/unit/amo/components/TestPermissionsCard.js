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

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const createAddonWithPermissions = (permissions) => {
    return createInternalAddon(
      createFakeAddon({
        files: [
          {
            ...fakePlatformFile,
            permissions,
          },
        ],
      }),
    );
  };

  function render(props = {}) {
    return shallowUntilTarget(
      <PermissionsCard
        addon={props.addon || createInternalAddon(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      PermissionsCardBase,
    );
  }

  describe('no permissions', () => {
    it('renders nothing without an addon', () => {
      const root = render({ addon: null });
      expect(root).not.toHaveClassName('PermissionsCard');
    });

    it('renders nothing for an addon with no permissions', () => {
      const root = render({ addon: createAddonWithPermissions([]) });
      expect(root).not.toHaveClassName('PermissionsCard');
    });

    it('renders nothing for an addon with no displayable permissions', () => {
      const root = render({
        addon: createAddonWithPermissions(['activeTab']),
      });
      expect(root).not.toHaveClassName('PermissionsCard');
    });
  });

  describe('with permissions', () => {
    it('renders itself', () => {
      const permission = 'bookmarks';
      const root = render({
        addon: createAddonWithPermissions([permission]),
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
