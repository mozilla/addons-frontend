import * as React from 'react';

import AddonAdminLinks, {
  AddonAdminLinksBase,
} from 'amo/components/AddonAdminLinks';
import {
  ADDONS_CONTENT_REVIEW,
  ADDONS_EDIT,
  ADDONS_REVIEW,
  ADDON_TYPE_STATIC_THEME,
  STATIC_THEMES_REVIEW,
} from 'amo/constants';
import {
  createInternalAddonWithLang,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  fakeTheme,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  const slug = 'some-slug';

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render(props = {}) {
    return shallowUntilTarget(
      <AddonAdminLinks
        addon={props.addon || createInternalAddonWithLang(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      AddonAdminLinksBase,
    );
  }

  const renderWithPermissions = ({
    addon = createInternalAddonWithLang({
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
    const root = renderWithPermissions({ permissions: ADDONS_REVIEW });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-edit-link')).toHaveLength(0);
  });

  it('does not show an admin add-on status link if the user does not have permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-admin-status-link')).toHaveLength(0);
  });

  it('shows an admin add-on link if the user has permission', () => {
    const id = 123;
    const addon = createInternalAddonWithLang({
      ...fakeAddon,
      id,
    });

    const root = renderWithPermissions({
      addon,
      permissions: [ADDONS_EDIT],
    });

    expect(root.find('.AddonAdminLinks-admin-link')).toHaveProp(
      'href',
      `/admin/models/addons/addon/${id}`,
    );
  });

  it('shows a content review link if the user has permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_CONTENT_REVIEW });

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
      addon: createInternalAddonWithLang({
        ...fakeTheme,
      }),
      permissions: [ADDONS_CONTENT_REVIEW, ADDONS_EDIT],
    });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-contentReview-link')).toHaveLength(0);
  });

  it('shows a code review link for an extension if the user has permission', () => {
    const root = renderWithPermissions({ permissions: ADDONS_REVIEW });

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

  it('shows a theme review link for a static theme if the user has permission', () => {
    const root = renderWithPermissions({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        slug,
        type: ADDON_TYPE_STATIC_THEME,
      }),
      permissions: STATIC_THEMES_REVIEW,
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
      addon: createInternalAddonWithLang({
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
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        slug,
      }),
      permissions: [ADDONS_EDIT, STATIC_THEMES_REVIEW],
    });

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
    expect(root.find('.AddonAdminLinks-themeReview-link')).toHaveLength(0);
  });
});
