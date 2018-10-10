import * as React from 'react';

import AddonAdminLinks, {
  AddonAdminLinksBase,
} from 'amo/components/AddonAdminLinks';
import {
  ADDONS_CONTENTREVIEW,
  ADDONS_EDIT,
  ADDONS_POSTREVIEW,
  ADMIN_TOOLS_VIEW,
  THEMES_REVIEW,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeTheme,
} from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  const slug = 'some-slug';

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render(props = {}) {
    return shallowUntilTarget(
      <AddonAdminLinks
        addon={props.addon || createInternalAddon(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      AddonAdminLinksBase,
    );
  }

  const renderWithPermissions = ({
    addon = createInternalAddon({
      ...fakeAddon,
      slug,
    }),
    permissions,
  }) => {
    const perms = Array.isArray(permissions) ? permissions : [permissions];
    dispatchSignInActions({ store, userProps: { permissions: perms } });
    return render({ addon });
  };

  it('returns nothing if the user does not have permission for any links', () => {
    const root = render();

    expect(root.find('.AddonAdminLinks')).toHaveLength(0);
  });

  it('returns nothing if the add-on is null', () => {
    const root = renderWithPermissions({
      addon: null,
      permissions: ADDONS_EDIT,
    });

    expect(root.find('.AddonAdminLinks')).toHaveLength(0);
  });

  it('shows the Admin Links heading if the user has permission for a link', () => {
    const root = renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
  });

  it('shows an edit add-on link if the user has permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(root.find('.AddonAdminLinks-edit-link')).toHaveProp(
      'href',
      `/developers/addon/${slug}/edit`,
    );
  });

  it('does not show an edit add-on link if the user does not have permission', () => {
    const root = renderWithPermissions({ permissions: ADMIN_TOOLS_VIEW });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-edit-link')).toHaveLength(0);
  });

  it('shows an admin add-on status link if the user has permission', () => {
    const root = renderWithPermissions({ permissions: ADMIN_TOOLS_VIEW });

    expect(root.find('.AddonAdminLinks-admin-status-link')).toHaveProp(
      'href',
      `/admin/addon/manage/${slug}/`,
    );
  });

  it('does not show an admin add-on status link if the user does not have permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-admin-status-link')).toHaveLength(0);
  });

  it('shows an admin add-on link if the user has permission', () => {
    const id = 123;
    const addon = createInternalAddon({
      ...fakeAddon,
      id,
    });

    const root = renderWithPermissions({
      addon,
      permissions: [ADMIN_TOOLS_VIEW, ADDONS_EDIT],
    });

    expect(root.find('.AddonAdminLinks-admin-link')).toHaveProp(
      'href',
      `/admin/models/addons/addon/${id}`,
    );
  });

  it.each([ADMIN_TOOLS_VIEW, ADDONS_EDIT])(
    'does not show an admin add-on link if the user only has the %s permission',
    (permission) => {
      const root = renderWithPermissions({
        permissions: permission,
      });

      expect(root.find('.AddonAdminLinks')).toHaveLength(1);
      expect(root.find('.AddonAdminLinks-admin-link')).toHaveLength(0);
    },
  );

  it('shows a content review link if the user has permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_CONTENTREVIEW });

    expect(root.find('.AddonAdminLinks-contentReview-link')).toHaveProp(
      'href',
      `/reviewers/review-content/${slug}`,
    );
  });

  it('does not show a content review link if the user does not have permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-contentReview-link')).toHaveLength(0);
  });

  it('does not show a content review link for a theme', () => {
    const root = renderWithPermissions({
      addon: createInternalAddon({
        ...fakeTheme,
      }),
      permissions: [ADDONS_CONTENTREVIEW, ADDONS_EDIT],
    });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-contentReview-link')).toHaveLength(0);
  });

  it('shows a code review link for an extension if the user has permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_POSTREVIEW });

    expect(root.find('.AddonAdminLinks-codeReview-link')).toHaveProp(
      'href',
      `/reviewers/review/${slug}`,
    );
    expect(root.find('.AddonAdminLinks-codeReview-link').children()).toHaveText(
      'Review add-on code',
    );
  });

  it('does not show a code review link if the user does not have permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-codeReview-link')).toHaveLength(0);
  });

  it('shows a theme review link for a theme if the user has permission', () => {
    const root = renderWithPermissions({
      addon: createInternalAddon({
        ...fakeTheme,
        slug,
      }),
      permissions: THEMES_REVIEW,
    });

    expect(root.find('.AddonAdminLinks-themeReview-link')).toHaveProp(
      'href',
      `/reviewers/review/${slug}`,
    );
    expect(
      root.find('.AddonAdminLinks-themeReview-link').children(),
    ).toHaveText('Review theme');
  });

  it('does not show a theme review link if the user does not have permission', () => {
    const root = renderWithPermissions({
      addon: createInternalAddon({
        ...fakeTheme,
        slug,
      }),
      permissions: ADDONS_EDIT,
    });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-themeReview-link')).toHaveLength(0);
  });

  it('does not show a theme review link if the user has permission but the add-on is not a theme', () => {
    const root = renderWithPermissions({
      addon: createInternalAddon({
        ...fakeAddon,
        slug,
      }),
      permissions: [ADDONS_EDIT, THEMES_REVIEW],
    });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-themeReview-link')).toHaveLength(0);
  });
});
