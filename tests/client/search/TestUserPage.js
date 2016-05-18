import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import * as api from 'core/api';
import { loadEntities, setCurrentUser } from 'search/actions';
import { UserPage, mapStateToProps, loadProfileIfNeeded } from 'search/containers/UserPage';

describe('<UserPage />', () => {
  it('renders the username and email', () => {
    const root = findDOMNode(renderIntoDocument(
      <UserPage email="me@example.com" username="my-username" />));
    assert.deepEqual(
      Array.from(root.querySelectorAll('li')).map((li) => li.textContent),
      ['username: my-username', 'email: me@example.com']);
  });

  it('pulls the user data from state', () => {
    const user = {username: 'me', email: 'me@example.com'};
    assert.strictEqual(
      mapStateToProps({auth: {username: user.username}, users: {[user.username]: user}}),
      user);
  });

  describe('loadProfileIfNeeded', () => {
    let mockApi;

    beforeEach(() => {
      mockApi = sinon.mock(api);
    });

    it('loads the profile when it is not loaded', () => {
      const apiConfig = {api: 'config'};
      const entities = {'the-username': {username: 'the-username'}};
      const result = 'the-username';
      const dispatch = sinon.stub();
      const store = {
        dispatch,
        getState() {
          return {
            api: apiConfig,
            auth: {},
            users: {},
          };
        },
      };
      mockApi
        .expects('fetchProfile')
        .withArgs({api: apiConfig})
        .returns(Promise.resolve({entities, result}));
      return loadProfileIfNeeded({store}).then(() => {
        assert(dispatch.calledWith(loadEntities(entities)));
        assert(dispatch.calledWith(setCurrentUser('the-username')));
        mockApi.verify();
      });
    });

    it('does not load the profile when it is loaded', () => {
      const apiConfig = {api: 'config'};
      const dispatch = sinon.stub();
      const store = {
        dispatch,
        getState() {
          return {
            api: apiConfig,
            auth: {username: 'me'},
            users: {me: {username: 'me'}},
          };
        },
      };
      mockApi
        .expects('fetchProfile')
        .never();
      return loadProfileIfNeeded({store}).then(() => {
        assert(!dispatch.called, 'dispatch should not be called');
        mockApi.verify();
      });
    });
  });
});
