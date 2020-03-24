import * as React from 'react';

import AddonAuthorLinks, {
  AddonAuthorLinksBase,
} from 'amo/components/AddonAuthorLinks';
import { createInternalAddon } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
} from 'tests/unit/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  const slug = 'some-slug';

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render(props = {}) {
    return shallowUntilTarget(
      <AddonAuthorLinks
        addon={props.addon || createInternalAddon(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      AddonAuthorLinksBase,
    );
  }

  const renderWithPermissions = ({
    addon = createInternalAddon({
      ...fakeAddon,
      slug,
      authors: [
        {
          id: 10642015,
          name: 'avgupt',
          picture_url: 'http://cdn.a.m.o/myphoto.jpg',
          url: 'http://a.m.o/en-GB/firefox/user/avgupt/',
          username: 'avgupt',
        },
      ],
    }),
    userId,
  }) => {
    dispatchSignInActions({ store, userId });
    return render({ addon });
  };

  it('returns nothing if the userId is null / not logged in', () => {
    const root = renderWithPermissions({});

    expect(root.find('.AddonAuthorLinks')).toHaveLength(0);
    expect(root.find('.AddonAuthorLinks-edit-link')).toHaveLength(0);
  });

  it('returns edit link if the author of the add-on in logged in', () => {
    const root = renderWithPermissions({ userId: 10642015 });

    expect(root.find('.AddonAuthorLinks')).toHaveLength(1);
    expect(root.find('.AddonAuthorLinks-edit-link')).toHaveLength(1);
  });

  it('returns nothing if the non-author of the add-on in logged in', () => {
    const root = renderWithPermissions({ userId: 10642014 });

    expect(root.find('.AddonAuthorLinks')).toHaveLength(0);
    expect(root.find('.AddonAuthorLinks-edit-link')).toHaveLength(0);
  });

  it('shows an edit add-on link if the user is author', () => {
    const root = renderWithPermissions({ userId: 10642015 });

    expect(root.find('.AddonAuthorLinks-edit-link')).toHaveProp(
      'href',
      `/developers/addon/${slug}/edit`,
    );
    expect(root.find('.AddonAuthorLinks-edit-link').children()).toHaveText(
      'Edit add-on',
    );
  });
});
