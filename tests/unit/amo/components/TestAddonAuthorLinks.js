import * as React from 'react';

import AddonAuthorLinks, {
  AddonAuthorLinksBase,
} from 'amo/components/AddonAuthorLinks';
import {
  createInternalAddonWithLang,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
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
      <AddonAuthorLinks
        addon={props.addon || createInternalAddonWithLang(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      AddonAuthorLinksBase,
    );
  }

  const renderWithSignedUser = ({
    addon = createInternalAddonWithLang({
      ...fakeAddon,
      slug,
      authors: [
        {
          id: 10642015,
          name: 'avgupt',
          picture_url: 'https://addons.mozilla.org/user-media/myphoto.jpg',
          url: 'https://addons.mozilla.org/en-GB/firefox/user/avgupt/',
          username: 'avgupt',
        },
      ],
    }),
    userId,
  }) => {
    dispatchSignInActions({ store, userId });
    return render({ addon });
  };

  it('returns nothing if the user is not logged in', () => {
    const root = render();

    expect(root.find('.AddonAuthorLinks')).toHaveLength(0);
    expect(root.find('.AddonAuthorLinks-edit-link')).toHaveLength(0);
  });

  it('returns nothing if a signed-in user is not the author of the add-on', () => {
    const root = renderWithSignedUser({ userId: 10642014 });

    expect(root.find('.AddonAuthorLinks')).toHaveLength(0);
    expect(root.find('.AddonAuthorLinks-edit-link')).toHaveLength(0);
  });

  it('shows an edit add-on link if the user is author', () => {
    const root = renderWithSignedUser({ userId: 10642015 });

    expect(root.find('.AddonAuthorLinks')).toHaveLength(1);
    expect(root.find('.AddonAuthorLinks-edit-link')).toHaveProp(
      'href',
      `/developers/addon/${slug}/edit`,
    );
    expect(root.find('.AddonAuthorLinks-edit-link').children()).toHaveText(
      'Edit add-on',
    );
  });

  it('returns nothing if the add-on is null', () => {
    const root = renderWithSignedUser({ addon: null });

    expect(root.find('.AddonAuthorLinks')).toHaveLength(0);
  });
});
