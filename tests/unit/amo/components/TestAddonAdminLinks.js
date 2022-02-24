import * as React from 'react';

import AddonAdminLinks from 'amo/components/AddonAdminLinks';
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
  fakeTheme,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  const addonId = 123;
  const slug = 'some-slug';

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render(props = {}) {
    return defaultRender(
      <AddonAdminLinks
        addon={props.addon || createInternalAddonWithLang(fakeAddon)}
        {...props}
      />,
      { store },
    );
  }

  const renderWithPermissions = ({
    addon = createInternalAddonWithLang({
      ...fakeAddon,
      slug,
      id: addonId,
    }),
    permissions,
  }) => {
    const perms = Array.isArray(permissions) ? permissions : [permissions];
    dispatchSignInActions({ store, userProps: { permissions: perms } });
    return render({ addon });
  };

  it('returns nothing if the user does not have permission for any links', () => {
    const { root } = render();

    expect(root).toBeNull();
  });

  it('returns nothing if the add-on is null', () => {
    const { root } = renderWithPermissions({
      addon: null,
      permissions: ADDONS_EDIT,
    });

    expect(root).toBeNull();
  });

  it('shows the Admin Links heading if the user has permission for a link', () => {
    renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(screen.getByText('Admin Links')).toBeInTheDocument();
  });

  it('shows edit and admin add-on links if the user has permission', () => {
    renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(screen.getByText('Edit add-on')).toHaveAttribute(
      'href',
      `/developers/addon/${slug}/edit`,
    );
    expect(screen.getByText('Admin add-on')).toHaveAttribute(
      'href',
      `/admin/models/addons/addon/${addonId}`,
    );
  });

  it('does not show an edit or admin add-on link if the user does not have permission', () => {
    renderWithPermissions({ permissions: ADDONS_REVIEW });

    expect(screen.getByText('Admin Links')).toBeInTheDocument();
    expect(screen.queryByText('Edit add-on')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin add-on')).not.toBeInTheDocument();
  });

  it('shows a content review link if the user has permission', () => {
    renderWithPermissions({ permissions: ADDONS_CONTENT_REVIEW });

    expect(screen.getByText('Content review add-on')).toHaveAttribute(
      'href',
      `/reviewers/review-content/${addonId}`,
    );
  });

  it('does not show a content review link if the user does not have permission', () => {
    renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(screen.getByText('Admin Links')).toBeInTheDocument();
    expect(screen.queryByText('Content review add-on')).not.toBeInTheDocument();
  });

  it('does not show a content review link for a theme', () => {
    renderWithPermissions({
      addon: createInternalAddonWithLang({
        ...fakeTheme,
      }),
      permissions: [ADDONS_CONTENT_REVIEW, ADDONS_EDIT],
    });

    expect(screen.getByText('Admin Links')).toBeInTheDocument();
    expect(screen.queryByText('Content review add-on')).not.toBeInTheDocument();
  });

  it('shows a code review link for an extension if the user has permission', () => {
    renderWithPermissions({ permissions: ADDONS_REVIEW });

    expect(screen.getByText('Review add-on code')).toHaveAttribute(
      'href',
      `/reviewers/review/${addonId}`,
    );
  });

  it('does not show a code review link if the user does not have permission', () => {
    renderWithPermissions({ permissions: ADDONS_EDIT });

    expect(screen.getByText('Admin Links')).toBeInTheDocument();
    expect(screen.queryByText('Review add-on code')).not.toBeInTheDocument();
  });

  it('shows a theme review link for a static theme if the user has permission', () => {
    renderWithPermissions({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        id: addonId,
        type: ADDON_TYPE_STATIC_THEME,
      }),
      permissions: STATIC_THEMES_REVIEW,
    });

    expect(screen.getByText('Review theme')).toHaveAttribute(
      'href',
      `/reviewers/review/${addonId}`,
    );
  });

  it('does not show a theme review link if the user does not have permission', () => {
    renderWithPermissions({
      addon: createInternalAddonWithLang({
        ...fakeTheme,
        id: addonId,
      }),
      permissions: ADDONS_EDIT,
    });

    expect(screen.getByText('Admin Links')).toBeInTheDocument();
    expect(screen.queryByText('Review theme')).not.toBeInTheDocument();
  });

  it('does not show a theme review link if the user has permission but the add-on is not a theme', () => {
    renderWithPermissions({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        id: addonId,
      }),
      permissions: [ADDONS_EDIT, STATIC_THEMES_REVIEW],
    });

    expect(screen.getByText('Admin Links')).toBeInTheDocument();
    expect(screen.queryByText('Review theme')).not.toBeInTheDocument();
  });
});
