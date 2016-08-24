import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import AddonPage from 'admin/containers/AddonPage';
import createStore from 'admin/store';

describe('AddonPage', () => {
  const basicAddon = {
    description: 'An add-on that adds on.',
    name: 'Addon!',
    slug: 'my-addon',
    summary: 'My add-on',
    status: 'public',
    tags: [],
    type: 'extension',
    url: 'https://addons.mozilla.org/firefox/addon/my-addon/',
    edit_url: 'https://addons.mozilla.org/developers/addon/my-addon/edit',
    review_url: 'https://addons.mozilla.org/en-US/editors/review/1865',
  };

  function render({ props, state }) {
    const store = createStore(state);
    return findDOMNode(renderIntoDocument(
      <Provider store={store} key="provider">
        <AddonPage {...props} />
      </Provider>
    ));
  }

  describe('rendered fields', () => {
    const initialState = {
      addons: {
        'my-addon': {
          ...basicAddon,
          homepage: 'https://example.com/my-addon',
          support_email: 'my-addon@example.com',
          support_url: 'https://example.com/my-addon/support',
          tags: ['foo-tag', 'bar-tag'],
          current_version: {
            version: '2.5-beta.1',
            url: 'https://a.m.org/versions/2.5-beta.1',
            edit_url: 'https://a.m.org/versions/2.5-beta.1/edit',
            files: [
              {
                id: 54321,
                platform: 'linux',
                status: 'public',
                size: 556677,
                created: '2016-04-01T12:11:10',
                url: 'https://addons.mozilla.org/files/54321',
              },
            ],
          },
        },
      },
    };
    let root;
    let info;

    beforeEach(() => {
      root = render({ state: initialState, props: { params: { slug: 'my-addon' } } });
      info = Array.from(root.querySelector('.addon--info').childNodes);
    });

    it('renders the name', () => {
      assert.equal(root.querySelector('h1').textContent, 'Addon!');
    });

    it('renders the summary', () => {
      assert.equal(root.querySelector('.addon--summary').textContent, 'My add-on');
    });

    it('renders the description', () => {
      assert.equal(
        root.querySelector('.addon--description').textContent, 'An add-on that adds on.');
    });

    it('renders the tags', () => {
      const tags = Array.from(root.querySelector('.addon--tags').childNodes);
      const tagText = tags.map((tag) => tag.textContent);
      assert.deepEqual(tagText, ['foo-tag', 'bar-tag']);
    });

    it('renders the addon info', () => {
      const infoText = info.map((infum) => infum.textContent);
      assert.deepEqual(
        infoText,
        ['extension', 'public', 'View on site', 'Edit on site', 'View on editors',
         'View homepage', 'Email support', 'View support site']);
    });

    it('renders the AMO page as a link', () => {
      const url = info.find(
        (infum) => infum.textContent === 'View on site').firstChild;
      assert.equal(url.tagName, 'A');
      assert.equal(url.getAttribute('href'), 'https://addons.mozilla.org/firefox/addon/my-addon/');
    });

    it('renders the manage page as a link', () => {
      const url = info.find(
        (infum) => infum.textContent === 'Edit on site').firstChild;
      assert.equal(url.tagName, 'A');
      assert.equal(
        url.getAttribute('href'), 'https://addons.mozilla.org/developers/addon/my-addon/edit');
    });

    it('renders the support email as a mailto', () => {
      const email = info.find((infum) => infum.textContent === 'Email support').firstChild;
      assert.equal(email.tagName, 'A');
      assert.equal(email.getAttribute('href'), 'mailto:my-addon@example.com');
    });

    it('renders the support url as a link', () => {
      const url = info.find(
        (infum) => infum.textContent === 'View support site').firstChild;
      assert.equal(url.tagName, 'A');
      assert.equal(url.getAttribute('href'), 'https://example.com/my-addon/support');
    });

    it('renders the homepage as a link', () => {
      const url = info.find(
        (infum) => infum.textContent === 'View homepage').firstChild;
      assert.equal(url.tagName, 'A');
      assert.equal(url.getAttribute('href'), 'https://example.com/my-addon');
    });

    it('renders the current version header', () => {
      assert.equal(
        root.querySelector('.addon--current-version h2').textContent,
        'Current version');
    });

    it('renders the current version', () => {
      const version = Array
        .from(root.querySelector('.addon--version-info').childNodes)
        .map((infum) => infum.textContent);
      assert.deepEqual(version, ['2.5-beta.1', 'View on site', 'Edit on site']);
    });

    it('renders the file info', () => {
      const file = Array
        .from(root.querySelector('.addon--file-info').childNodes)
        .map((infum) => infum.textContent);
      assert.deepEqual(
        file, ['linux', 'public', '556677 bytes', '2016-04-01T12:11:10', 'Download']);
    });
  });

  describe('optional fields', () => {
    const initialState = { addons: { 'my-addon': basicAddon } };
    let root;

    beforeEach(() => {
      root = render({ state: initialState, props: { params: { slug: 'my-addon' } } });
    });

    it('does not render the info', () => {
      const info = Array.from(root.querySelector('.addon--info').childNodes);
      const infoText = info.map((infum) => infum.textContent);
      assert.deepEqual(
        infoText,
        ['extension', 'public', 'View on site', 'Edit on site', 'View on editors']);
    });

    it('does not render the tags', () => {
      const tags = root.querySelector('.addon--tags');
      assert.strictEqual(tags, null);
    });

    it('notes that there is no current version', () => {
      assert.equal(
        root.querySelector('.addon--current-version h2').textContent, 'No current version');
    });
  });

  describe('themes', () => {
    const initialState = {
      addons: {
        'my-addon': {
          ...basicAddon,
          type: 'Theme',
        },
      },
    };

    it('does not render the version', () => {
      const root = render({ state: initialState, props: { params: { slug: 'my-addon' } } });
      assert.strictEqual(root.querySelector('.addon--current-version'), null);
    });
  });

  it('renders NotFound when the add-on is not loaded', () => {
    const initialState = { addons: { 'my-addon': basicAddon } };
    const root = render({ state: initialState, props: { params: { slug: 'other-addon' } } });
    assert(root.querySelector('h1').textContent.includes("we can't find what you're looking for"));
  });
});
