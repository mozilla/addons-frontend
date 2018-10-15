import * as React from 'react';

import AddonTitle, { AddonTitleBase } from 'amo/components/AddonTitle';
import Link from 'amo/components/Link';
import { createInternalAddon } from 'core/reducers/addons';
import LoadingText from 'ui/components/LoadingText';
import { shallowUntilTarget, fakeAddon, fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallowUntilTarget(
      <AddonTitle i18n={fakeI18n()} {...props} />,
      AddonTitleBase,
    );
  };

  it('renders a LoadingText component when add-on is passed', () => {
    const root = render({ addon: null });

    expect(root.find(LoadingText)).toHaveLength(1);
  });

  it('renders the name of the add-on', () => {
    const name = 'some addon name';
    const root = render({
      addon: createInternalAddon({ ...fakeAddon, name }),
    });

    expect(root).toIncludeText(name);
  });

  it('renders a single author', () => {
    const author = {
      ...fakeAddon.authors[0],
      username: 'some-username',
    };

    const root = render({
      addon: createInternalAddon({ ...fakeAddon, authors: [author] }),
    });

    expect(root.find(Link)).toHaveLength(1);
    expect(root.find(Link)).toHaveProp('children', author.name);
    expect(root.find(Link)).toHaveProp('to', `/user/${author.username}/`);
  });

  it('renders multiple authors', () => {
    const author1 = {
      ...fakeAddon.authors[0],
      name: 'Author 1',
      username: 'author-1',
    };
    const author2 = {
      ...fakeAddon.authors[0],
      name: 'Author 2',
      username: 'author-2',
    };

    const root = render({
      addon: createInternalAddon({ ...fakeAddon, authors: [author1, author2] }),
    });

    expect(root.find(Link)).toHaveLength(2);
    expect(root.find(Link).at(0)).toHaveProp('children', author1.name);
    expect(root.find(Link).at(0)).toHaveProp(
      'to',
      `/user/${author1.username}/`,
    );
    expect(root.find(Link).at(1)).toHaveProp('children', author2.name);
    expect(root.find(Link).at(1)).toHaveProp(
      'to',
      `/user/${author2.username}/`,
    );
    // This assertion is used to make sure we add commas between each author
    // link/name.
    expect(root).toIncludeText(
      'by <Connect(LinkBase) />, <Connect(LinkBase) />',
    );
  });

  it('renders without authors', () => {
    const addon = createInternalAddon({ ...fakeAddon, authors: null });
    const root = render({ addon });

    // This makes sure only the add-on name is displayed.
    expect(root.text()).toEqual(addon.name);
  });

  it('renders an author without url', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        authors: [
          {
            name: 'Krupa',
            url: null,
          },
        ],
      }),
    });

    expect(root).toIncludeText('Krupa');
    expect(root.find(Link)).toHaveLength(0);
  });

  it('sanitizes a title', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        name: '<script>alert(document.cookie);</script>',
        authors: [],
      }),
    });

    // Make sure an actual script tag was not created.
    expect(root.find('h1 script')).toHaveLength(0);
    // Make sure the script removed.
    expect(root.find('h1').html()).not.toContain('<script>');
  });
});
