import { shallow } from 'enzyme';
import * as React from 'react';

import Link from 'amo/components/Link';
import Permission from 'amo/components/Permission';
import PermissionsCard, {
  PermissionsCardBase,
} from 'amo/components/PermissionsCard';
import {
  createInternalVersionWithLang,
  dispatchClientMetadata,
  fakeI18n,
  fakeFile,
  fakeVersion,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const createVersionWithPermissions = ({
    optional = [],
    required = [],
    versionProps = {},
  } = {}) => {
    return createInternalVersionWithLang({
      ...fakeVersion,
      file: {
        ...fakeFile,
        optional_permissions: optional,
        permissions: required,
      },

      ...versionProps,
    });
  };

  function render(props = {}) {
    return shallowUntilTarget(
      <PermissionsCard
        version={props.version || createInternalVersionWithLang(fakeVersion)}
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
      const root = render({ version: createVersionWithPermissions() });
      expect(root).not.toHaveClassName('PermissionsCard');
    });

    it('renders nothing for a version with no displayable permissions', () => {
      const root = render({
        version: createVersionWithPermissions({
          optional: ['activeTab'],
          required: ['activeTab'],
        }),
      });
      expect(root).not.toHaveClassName('PermissionsCard');
    });
  });

  describe('with permissions', () => {
    it('passes the expected contentId to ShowMoreCard', () => {
      const id = 12345;
      const permission = 'bookmarks';
      const root = render({
        version: createVersionWithPermissions({
          required: [permission],
          versionProps: { id },
        }),
      });

      expect(root).toHaveProp('contentId', id);
    });

    it('renders learn more link in header', () => {
      const permission = 'bookmarks';
      const root = render({
        version: createVersionWithPermissions({ required: [permission] }),
      });
      const header = shallow(root.prop('header'));

      expect(root).toHaveClassName('PermissionsCard');
      expect(header).toHaveClassName('PermissionsCard-header');
      expect(header.find(Link)).toHaveClassName('PermissionsCard-learn-more');
      expect(header.find(Link)).toHaveProp('externalDark', true);
    });

    it('renders required permissions only', () => {
      const permission = 'bookmarks';
      const root = render({
        version: createVersionWithPermissions({ required: [permission] }),
      });
      expect(root).toHaveClassName('PermissionsCard');
      expect(root.find('p')).toHaveClassName(
        'PermissionsCard-subhead--required',
      );
      expect(root.find('ul')).toHaveClassName('PermissionsCard-list--required');
      expect(root.find(Permission)).toHaveProp('type', permission);
      expect(root.find('.PermissionsCard-subhead--optional')).toHaveLength(0);
      expect(root.find('.PermissionsCard-list--optional')).toHaveLength(0);
    });

    it('renders optional permissions only', () => {
      const permission = 'bookmarks';
      const root = render({
        version: createVersionWithPermissions({ optional: [permission] }),
      });
      expect(root).toHaveClassName('PermissionsCard');
      expect(root.find('p')).toHaveClassName(
        'PermissionsCard-subhead--optional',
      );
      expect(root.find('ul')).toHaveClassName('PermissionsCard-list--optional');
      expect(root.find(Permission)).toHaveProp('type', permission);
      expect(root.find('.PermissionsCard-subhead--required')).toHaveLength(0);
      expect(root.find('.PermissionsCard-list--required')).toHaveLength(0);
    });

    it('renders both optional and required permissions', () => {
      const optionalPermission = 'bookmarks';
      const requiredPermission = 'history';
      const root = render({
        version: createVersionWithPermissions({
          optional: [optionalPermission],
          required: [requiredPermission],
        }),
      });
      expect(root).toHaveClassName('PermissionsCard');
      expect(root.find('p').at(0)).toHaveClassName(
        'PermissionsCard-subhead--required',
      );
      expect(
        root.find('.PermissionsCard-list--required').find(Permission),
      ).toHaveProp('type', requiredPermission);
      expect(root.find('p').at(1)).toHaveClassName(
        'PermissionsCard-subhead--optional',
      );
      expect(
        root.find('.PermissionsCard-list--optional').find(Permission),
      ).toHaveProp('type', optionalPermission);
    });
  });
});
