import * as React from 'react';

import AddonTitle from 'amo/components/AddonTitle';
import { getAddonURL } from 'amo/utils';
import {
  createInternalAddonWithLang,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  render as defaultRender,
  screen,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = (props = {}) => {
    return defaultRender(<AddonTitle {...props} />, { store });
  };

  it('renders LoadingText when no add-on is passed', () => {
    render({ addon: null });

    expect(screen.getByClassName('LoadingText')).toBeInTheDocument();
  });

  it('renders the name of the add-on', () => {
    const name = 'some addon name';
    render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        name: createLocalizedString(name),
      }),
    });

    expect(screen.getByRole('heading')).toHaveTextContent(name);
  });

  it('renders a single author', () => {
    const author = {
      ...fakeAddon.authors[0],
      id: 123,
    };

    render({
      addon: createInternalAddonWithLang({ ...fakeAddon, authors: [author] }),
    });

    const link = screen.getByRole('link', { name: author.name });
    expect(link).toHaveAttribute('href', `/en-US/android/user/${author.id}/`);
  });

  it('renders multiple authors', () => {
    const author1 = {
      ...fakeAddon.authors[0],
      name: 'Author 1',
      id: 101,
    };
    const author2 = {
      ...fakeAddon.authors[0],
      name: 'Author 2',
      id: 102,
    };

    render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        authors: [author1, author2],
      }),
    });

    expect(screen.getAllByRole('link')).toHaveLength(2);
    const link1 = screen.getByRole('link', { name: author1.name });
    expect(link1).toHaveAttribute('href', `/en-US/android/user/${author1.id}/`);
    const link2 = screen.getByRole('link', { name: author2.name });
    expect(link2).toHaveAttribute('href', `/en-US/android/user/${author2.id}/`);

    expect(
      screen.getByTextAcrossTags(` by ${author1.name}, ${author2.name}`),
    ).toBeInTheDocument();
  });

  it('renders without authors', () => {
    const addon = createInternalAddonWithLang({ ...fakeAddon, authors: null });
    render({ addon });

    // This makes sure only the add-on name is displayed.
    expect(screen.getByRole('heading')).toHaveTextContent(addon.name.content);
    expect(
      screen.queryByClassName('AddonTitle-author'),
    ).not.toBeInTheDocument();
  });

  it('renders an author without url', () => {
    const name = 'Bob';
    render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        authors: [
          {
            name,
            url: null,
          },
        ],
      }),
    });

    expect(screen.getByText(`by ${name}`)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('sanitizes a title', () => {
    render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        name: createLocalizedString('<script>alert(document.cookie);</script>'),
        authors: [],
      }),
    });

    expect(screen.queryByTagName('script')).not.toBeInTheDocument();
  });

  it('handles RTL mode', () => {
    // `fa` is a RTL language.
    dispatchClientMetadata({ lang: 'fa', store });

    const author1 = {
      ...fakeAddon.authors[0],
      name: 'Author 1',
      id: 101,
    };
    const author2 = {
      ...fakeAddon.authors[0],
      name: 'Author 2',
      id: 102,
    };

    render({
      addon: createInternalAddonWithLang({
        ...fakeAddon,
        authors: [author1, author2],
      }),
    });

    expect(screen.getAllByRole('link')).toHaveLength(2);
    const link1 = screen.getByRole('link', { name: author1.name });
    expect(link1).toHaveAttribute('href', `/fa/android/user/${author1.id}/`);
    const link2 = screen.getByRole('link', { name: author2.name });
    expect(link2).toHaveAttribute('href', `/fa/android/user/${author2.id}/`);

    expect(screen.getByClassName('AddonTitle-author')).toHaveTextContent(
      `${author1.name} ,${author2.name} by`,
    );
  });

  it('does not link to the add-on detail page when the "linkToAddon" prop is false', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    render({ addon, linkToAddon: false });

    // Only the author link should appear.
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: addon.authors[0].name }),
    ).toHaveAttribute('href', `/en-US/android/user/${addon.authors[0].id}/`);
  });

  it('links to the add-on detail page when the "linkToAddon" prop is true', () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    render({ addon, linkToAddon: true });

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(
      screen.getByRole('link', { name: addon.name.content }),
    ).toHaveAttribute('href', `/en-US/android${getAddonURL(addon.slug)}`);
    expect(
      screen.getByRole('link', { name: addon.authors[0].name }),
    ).toHaveAttribute('href', `/en-US/android/user/${addon.authors[0].id}/`);
  });

  it('renders with a h1 tag by default', () => {
    render();

    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it("renders the element tag that is specified by the 'as' prop", () => {
    const addon = createInternalAddonWithLang(fakeAddon);
    render({ addon, as: 'span' });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getAllByTagName('span')[0]).toHaveTextContent(
      addon.name.content,
    );
  });

  it('accepts some query params for attribution to append to the add-on URL', () => {
    const queryParamsForAttribution = { some: 'value' };
    const addon = createInternalAddonWithLang(fakeAddon);

    render({
      addon,
      linkToAddon: true,
      queryParamsForAttribution,
    });

    expect(
      screen.getByRole('link', { name: addon.name.content }),
    ).toHaveAttribute(
      'href',
      `/en-US/android${getAddonURL(addon.slug)}?some=value`,
    );
  });
});
