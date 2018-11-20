import * as React from 'react';

import AddonTitle, { AddonTitleBase } from 'amo/components/AddonTitle';
import Link from 'amo/components/Link';
import { createInternalAddon } from 'core/reducers/addons';
import LoadingText from 'ui/components/LoadingText';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallowUntilTarget(
      <AddonTitle
        i18n={fakeI18n()}
        store={dispatchClientMetadata().store}
        {...props}
      />,
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
      id: 123,
    };

    const root = render({
      addon: createInternalAddon({ ...fakeAddon, authors: [author] }),
    });

    expect(root.find(Link)).toHaveLength(1);
    expect(root.find(Link)).toHaveProp('children', author.name);
    expect(root.find(Link)).toHaveProp('to', `/user/${author.id}/`);
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

    const root = render({
      addon: createInternalAddon({ ...fakeAddon, authors: [author1, author2] }),
    });

    expect(root.find(Link)).toHaveLength(2);
    expect(root.find(Link).at(1)).toHaveProp('children', author2.name);
    expect(root.find(Link).at(1)).toHaveProp('to', `/user/${author2.id}/`);

    const authors = root.find('.AddonTitle-author');

    // First child should be the "by"
    expect(authors.childAt(0).text()).toEqual('by');
    // Then it should be the empty space between "by" and the links
    expect(authors.childAt(1).text()).toEqual(' ');
    // Then it should be a Link
    expect(authors.childAt(2)).toHaveProp('to');
    expect(authors.childAt(2)).toHaveProp('children', author1.name);
    expect(authors.childAt(2)).toHaveProp('to', `/user/${author1.id}/`);
    // Then, it should be a separator (comma)
    expect(authors.childAt(3).text()).toEqual(', ');
    // Then, it should be the second Link
    expect(authors.childAt(4)).toHaveProp('to');
    expect(authors.childAt(4)).toHaveProp('children', author2.name);
    expect(authors.childAt(4)).toHaveProp('to', `/user/${author2.id}/`);
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

  it('handles RTL mode', () => {
    // `fa` is a RTL language.
    const { store } = dispatchClientMetadata({ lang: 'fa' });

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

    const root = render({
      addon: createInternalAddon({ ...fakeAddon, authors: [author1, author2] }),
      store,
    });

    const authors = root.find('.AddonTitle-author');

    // First child should be a Link
    expect(authors.childAt(0)).toHaveProp('children', author1.name);
    expect(authors.childAt(0)).toHaveProp('to', `/user/${author1.id}/`);
    // Then, it should be a separator (comma)
    expect(authors.childAt(1).text()).toEqual(' ,');
    // Then it should be a second Link
    expect(authors.childAt(2)).toHaveProp('children', author2.name);
    expect(authors.childAt(2)).toHaveProp('to', `/user/${author2.id}/`);
    // Then it should be the empty space between "by" and the links
    expect(authors.childAt(3).text()).toEqual(' ');
    // Finally, it should be the "by"
    expect(authors.childAt(4).text()).toEqual('by');
  });

  it('does not link to the add-on detail page when the "linkToAddon" prop is false', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon, linkToAddon: false });

    expect(root.find(Link)).toHaveLength(1);
  });

  it('links to the add-on detail page when the "linkToAddon" prop is true', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon, linkToAddon: true });

    expect(root.find(Link)).toHaveLength(2);
    expect(root.find(Link).at(0)).toHaveProp('children', addon.name);
    expect(root.find(Link).at(0)).toHaveProp('to', `/addon/${addon.slug}/`);
  });

  it('renders with a h1 tag by default', () => {
    const root = render();

    expect(root.find('h1.AddonTitle')).toHaveLength(1);
  });

  it("renders the element tag that is specified by the 'as' prop", () => {
    const root = render({ as: 'span' });

    expect(root.find('h1')).toHaveLength(0);
    expect(root.find('span.AddonTitle')).toHaveLength(1);
  });
});
