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
  const { store } = dispatchClientMetadata();
  const slug = 'some-slug';

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

  const renderWithPermission = (permission) => {
    return render({
      addon: createInternalAddon({
        ...fakeAddon,
        slug,
      }),
      store: dispatchSignInActions({
        userProps: { permissions: [permission] },
      }).store,
    });
  };

  it('returns nothing if the user does not have permission for any links', () => {
    const root = render();

    expect(root.find('.AddonAdminLinks')).toHaveLength(0);
  });

  it('returns nothing if the add-on is missing', () => {
    const root = render({ addon: undefined });

    expect(root.find('.AddonAdminLinks')).toHaveLength(0);
  });

  it('shows the Admin Links heading if the user has permission for a link', () => {
    const root = renderWithPermission(ADDONS_EDIT);

    expect(root.find('.AddonAdminLinks')).toHaveLength(1);
  });

  it('shows an edit add-on link if the user has permission', () => {
    const root = renderWithPermission(ADDONS_EDIT);

    expect(root.find('.AddonAdminLinks-edit-link')).toHaveProp(
      'href',
      `/developers/addon/${slug}/edit`,
    );
  });

  it('shows an admin add-on link if the user has permission', () => {
    const root = renderWithPermission(ADMIN_TOOLS_VIEW);

    expect(root.find('.AddonAdminLinks-admin-link')).toHaveProp(
      'href',
      `/admin/addon/manage/${slug}/`,
    );
  });

  it('shows a content review link if the user has permission', () => {
    const root = renderWithPermission(ADDONS_CONTENTREVIEW);

    expect(root.find('.AddonAdminLinks-contentReview-link')).toHaveProp(
      'href',
      `/reviewers/review-content/${slug}`,
    );
  });

  it('shows a code review link for an extension if the user has permission', () => {
    const root = renderWithPermission(ADDONS_POSTREVIEW);

    expect(root.find('.AddonAdminLinks-codeReview-link')).toHaveProp(
      'href',
      `/reviewers/review/${slug}`,
    );
  });

  it('shows a theme review link for a theme if the user has permission', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeTheme,
        slug,
      }),
      store: dispatchSignInActions({
        userProps: { permissions: [THEMES_REVIEW] },
      }).store,
    });

    expect(root.find('.AddonAdminLinks-themeReview-link')).toHaveProp(
      'href',
      `/reviewers/review/${slug}`,
    );
  });

  it('does not show a theme review link if the user has permission but the add-on is not a theme', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        slug,
      }),
      store: dispatchSignInActions({
        userProps: { permissions: [THEMES_REVIEW] },
      }).store,
    });

    expect(root.find('.AddonAdminLinks-themeReview-link')).toHaveLength(0);
  });
});
