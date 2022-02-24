import * as React from 'react';

import AddonAuthorLinks from 'amo/components/AddonAuthorLinks';
import {
  createInternalAddonWithLang,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeAuthor,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  const slug = 'some-slug';

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  function render(props = {}) {
    return defaultRender(
      <AddonAuthorLinks
        addon={props.addon || createInternalAddonWithLang(fakeAddon)}
        {...props}
      />,
      { store },
    );
  }

  const renderWithSignedUser = ({
    addon = createInternalAddonWithLang({
      ...fakeAddon,
      slug,
      authors: [{ ...fakeAuthor, id: 10642015 }],
    }),
    userId,
  }) => {
    dispatchSignInActions({ store, userId });
    return render({ addon });
  };

  it('returns nothing if the user is not logged in', () => {
    const { root } = render();

    expect(root).toBeNull();
  });

  it('returns nothing if a signed-in user is not the author of the add-on', () => {
    const { root } = renderWithSignedUser({ userId: 10642014 });

    expect(root).toBeNull();
  });

  it('shows an edit add-on link if the user is author', () => {
    renderWithSignedUser({ userId: 10642015 });
    screen.debug();

    expect(screen.getByText('Author Links')).toBeInTheDocument();
    expect(screen.getByText('Edit add-on')).toHaveAttribute(
      'href',
      `/developers/addon/${slug}/edit`,
    );
  });

  it('returns nothing if the add-on is null', () => {
    const { root } = renderWithSignedUser({ addon: null });

    expect(root).toBeNull();
  });
});
