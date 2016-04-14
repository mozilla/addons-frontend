import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import AddonPage, { findAddon, loadAddonIfNeeded } from 'search/containers/AddonPage';
import createStore from 'search/store';
import * as api from 'core/api';
import * as actions from 'search/actions';

describe('AddonPage', () => {
  const basicAddon = {
    description: 'An add-on that adds on.',
    name: 'Addon!',
    slug: 'my-addon',
    summary: 'My add-on',
    status: 'Fully Reviewed',
    tags: [],
    type: 'Extension',
    url: 'https://addons.mozilla.org/firefox/addon/my-addon/',
  };

  function render({props, state}) {
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
            files: [
              {
                platform: 'Linux',
                status: 'Fully Reviewed',
                size: 556677,
                created: '2016-04-01T12:11:10',
                url: 'https://addons.mozilla.org/files/54321',
              },
            ],
          },
        },
      },
    };

    const root = render({state: initialState, props: {params: {slug: 'my-addon'}}});

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

    const info = Array.from(root.querySelector('.addon--info').childNodes);
    it('renders the addon info', () => {
      const infoText = info.map((infum) => infum.textContent);
      assert.deepEqual(
        infoText,
        ['Extension', 'Fully Reviewed', 'View on site', 'Edit on site', 'View homepage',
         'Email support', 'View support site']);
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
      assert.deepEqual(version, ['2.5-beta.1']);
    });

    it('renders the file info', () => {
      const file = Array
        .from(root.querySelector('.addon--file-info').childNodes)
        .map((infum) => infum.textContent);
      assert.deepEqual(
        file, ['Linux', 'Fully Reviewed', '556677 bytes', '2016-04-01T12:11:10', 'Download']);
    });
  });

  describe('optional fields', () => {
    const initialState = {addons: {'my-addon': basicAddon}};
    const root = render({state: initialState, props: {params: {slug: 'my-addon'}}});

    it('does not render the info', () => {
      const info = Array.from(root.querySelector('.addon--info').childNodes);
      const infoText = info.map((infum) => infum.textContent);
      assert.deepEqual(
        infoText,
        ['Extension', 'Fully Reviewed', 'View on site', 'Edit on site']);
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
    const root = render({state: initialState, props: {params: {slug: 'my-addon'}}});

    it('does not render the version', () => {
      assert.strictEqual(root.querySelector('.addon--current-version'), null);
    });
  });

  it('renders NotFound when the add-on is not loaded', () => {
    const initialState = {addons: {'my-addon': basicAddon}};
    const root = render({state: initialState, props: {params: {slug: 'other-addon'}}});
    assert(root.querySelector('h1').textContent.includes("we can't find what you're looking for"));
  });

  describe('findAddon', () => {
    const addon = sinon.stub();
    const state = {
      addons: {
        'the-addon': addon,
      },
    };

    it('finds the add-on in the state', () => {
      assert.strictEqual(findAddon(state, 'the-addon'), addon);
    });

    it('does not find the add-on in the state', () => {
      assert.strictEqual(findAddon(state, 'different-addon'), undefined);
    });
  });

  describe('loadAddonIfNeeded', () => {
    const loadedSlug = 'my-addon';
    let loadedAddon;
    let dispatch;
    let mocks;

    beforeEach(() => {
      loadedAddon = sinon.stub();
      dispatch = sinon.spy();
      mocks = [];
    });

    afterEach(() => {
      mocks.forEach((mock) => mock.restore());
    });

    function makeMock(thing) {
      const mock = sinon.mock(thing);
      mocks.push(mock);
      return mock;
    }

    function makeProps(slug) {
      return {
        store: {
          getState: () => ({
            addons: {
              [loadedSlug]: loadedAddon,
            },
          }),
          dispatch,
        },
        params: {slug},
      };
    }

    it('returns the add-on if loaded', () => {
      assert.strictEqual(loadAddonIfNeeded(makeProps(loadedSlug)), loadedAddon);
    });

    it('loads the add-on if it is not loaded', () => {
      const slug = 'other-addon';
      const props = makeProps(slug);
      const state = props.store.getState();
      const addon = sinon.stub();
      const entities = {[slug]: addon};
      const mockApi = makeMock(api);
      mockApi
        .expects('fetchAddon')
        .once()
        .withArgs({slug, state})
        .returns(Promise.resolve({entities}));
      const action = sinon.stub();
      const mockActions = makeMock(actions);
      mockActions
        .expects('loadEntities')
        .once()
        .withArgs(entities)
        .returns(action);
      return loadAddonIfNeeded(props).then(() => {
        assert(dispatch.calledWith(action), 'dispatch not called');
        mockApi.verify();
        mockActions.verify();
      });
    });

    it('handles 404s when loading the add-on', () => {
      const slug = 'other-addon';
      const props = makeProps(slug);
      const state = props.store.getState();
      const mockApi = makeMock(api);
      mockApi
        .expects('fetchAddon')
        .once()
        .withArgs({slug, state})
        .returns(Promise.reject(new Error('Error accessing API')));
      const mockActions = makeMock(actions);
      mockActions
        .expects('loadEntities')
        .never();
      return loadAddonIfNeeded(props).then(() => {
        assert(false, 'expected promise to fail');
      }, () => {
        assert(!dispatch.called, 'dispatch called');
        mockApi.verify();
        mockActions.verify();
      });
    });
  });
});
