import * as React from 'react';
import { oneLine } from 'common-tags';

import AddonTitle, { AddonTitleBase } from 'amo/components/AddonTitle';
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

    expect(root.html()).toContain(name);
  });

  it('renders a single author', () => {
    const authorUrl = 'http://olympia.test/en-US/firefox/user/krupa/';
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        authors: [
          {
            name: 'Krupa',
            url: authorUrl,
          },
        ],
      }),
    });

    expect(root.html()).toContain('Krupa');
    expect(root.html()).toContain(authorUrl);
  });

  it('renders multiple authors', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        authors: [
          {
            name: 'Krupa',
            url: 'http://olympia.test/en-US/firefox/user/krupa/',
          },
          {
            name: 'Fligtar',
            url: 'http://olympia.test/en-US/firefox/user/fligtar/',
          },
        ],
      }),
    });

    expect(root.html()).toContain('Krupa');
    expect(root.html()).toContain('Fligtar');
    expect(root.render().find('a')).toHaveLength(2);
  });

  it('renders without authors', () => {
    const addon = createInternalAddon({ ...fakeAddon, authors: null });
    const root = render({ addon });

    expect(root.html()).toContain(addon.name);
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

    expect(root.html()).toContain('Krupa');
    expect(root.render().find('a')).toHaveLength(0);
  });

  it('sanitizes a title', () => {
    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        name: '<script>alert(document.cookie);</script>',
      }),
    });

    // Make sure an actual script tag was not created.
    expect(root.find('h1 script')).toHaveLength(0);
    // Make sure the script removed.
    expect(root.find('h1').html()).not.toContain('<script>');
  });

  it('allows certain HTML tags in the title', () => {
    const name = 'Krupa';
    const url = 'http://olympia.test/en-US/firefox/user/krupa/';

    const root = render({
      addon: createInternalAddon({
        ...fakeAddon,
        authors: [
          {
            name,
            url,
          },
        ],
      }),
    });

    // Make sure these tags were whitelisted and make sure the santizer didn't
    // strip the class attribute:
    expect(root).toHaveHTML(oneLine`<h1 class="AddonTitle">Chill Out <span
      class="AddonTitle-author">by <a href="${url}">${name}</a></span></h1>`);
  });
});
