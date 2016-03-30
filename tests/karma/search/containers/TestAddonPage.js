import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import AddonPage, { findAddon, loadAddonIfNeeded } from 'search/containers/AddonPage';
import createStore from 'search/store';
import * as api from 'core/api';
import * as actions from 'search/actions';

describe('AddonPage', () => {
  const initialState = {
    addons: {
      'my-addon': {name: 'Addon!', slug: 'my-addon', url: 'http://example.com/my-addon', tags: []},
    },
  };

  function render({props, state}) {
    const store = createStore(state);
    return findDOMNode(renderIntoDocument(
      <Provider store={store} key="provider">
        <AddonPage {...props} />
      </Provider>
    ));
  }

  it('renders the name', () => {
    const root = render({state: initialState, props: {params: {slug: 'my-addon'}}});
    assert.equal(root.querySelector('h1').textContent, 'Addon!');
  });

  it('loads the add-on if not found', () => {
    const root = render({state: initialState, props: {params: {slug: 'other-addon'}}});
    assert.equal(root.querySelector('h1').textContent, 'Loading...');
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
      const addon = sinon.stub();
      const entities = {[slug]: addon};
      const mockApi = makeMock(api);
      mockApi
        .expects('fetchAddon')
        .once()
        .withArgs(slug)
        .returns(Promise.resolve({entities}));
      const action = sinon.stub();
      const mockActions = makeMock(actions);
      mockActions
        .expects('loadEntities')
        .once()
        .withArgs(entities)
        .returns(action);
      return loadAddonIfNeeded(makeProps(slug)).then(() => {
        assert(dispatch.calledWith(action), 'dispatch not called');
        mockApi.verify();
        mockActions.verify();
      });
    });
  });
});
