/* eslint-disable import/prefer-default-export */
import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import { mapDispatchToProps, mapStateToProps, OverallRatingBase }
  from 'amo/components/OverallRating';
import { SET_USER_RATING } from 'amo/constants';
import * as api from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';

import { fakeAddon } from './TestAddonDetail';

function render(customProps = {}) {
  const props = {
    addonName: fakeAddon.name,
    addonID: fakeAddon.id,
    authToken: 'secret-token',
    version: fakeAddon.current_version,
    i18n: getFakeI18nInst(),
    createRating: () => {},
    ...customProps,
  };
  const root = findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={props.i18n}>
      <OverallRatingBase {...props} />
    </I18nProvider>
  ), OverallRatingBase);

  return findDOMNode(root);
}

export function createRatingResponse(customProps = {}) {
  return {
    id: 123,
    user: { name: 'the_username' },
    rating: 5,
    version: fakeAddon.current_version,
    body: null,
    title: null,
    ...customProps,
  };
}

describe('OverallRating', () => {
  function selectRating(root, inputSelector) {
    // Select a rating checkbox and simulate a form change event.
    const input = root.querySelector(inputSelector);
    assert.ok(input, `No input returned for selector: ${inputSelector}`);
    input.checked = true;
    const form = root.querySelector('form');
    Simulate.change(form, { currentTarget: form });
  }

  it('prompts you to rate the add-on by name', () => {
    const rootNode = render({ addonName: 'Some Add-on' });
    assert.include(rootNode.querySelector('p').textContent,
                   'Some Add-on');
  });

  it('prompts you to rate the add-on at an exact version', () => {
    const rootNode = render({ version: { id: 1, version: '2.0.14' } });
    assert.include(rootNode.querySelector('p').textContent,
                   '2.0.14');
  });

  it('creates a rating with add-on and version info', () => {
    const createRating = sinon.stub();
    const root = render({
      createRating,
      authToken: 'token',
      version: { id: 321 },
      addonID: 12345,
    });
    selectRating(root, 'input#OverallRating-love-it');
    assert.equal(createRating.called, true);

    const call = createRating.firstCall.args[0];
    assert.equal(call.versionID, 321);
    assert.equal(call.authToken, 'token');
    assert.equal(call.addonID, 12345);
  });

  it('lets you submit a "love it" rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, 'input#OverallRating-love-it');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 5);
  });

  it('lets you submit a "it is OK" rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, 'input#OverallRating-it-is-ok');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 3);
  });

  it('lets you submit a "huh?" rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, 'input#OverallRating-huh');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 1);
  });

  it('ignores form changes without a selected rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    const form = root.querySelector('form');
    Simulate.change(form, { currentTarget: form });
    assert.equal(createRating.called, false);
  });

  describe('mapDispatchToProps', () => {
    describe('createRating', () => {
      let mockApi;
      let actions;
      let dispatch;

      beforeEach(() => {
        mockApi = sinon.mock(api);
        dispatch = sinon.stub();
        actions = mapDispatchToProps(dispatch);
      });

      const createRating = (customProps = {}) => actions.createRating({
        rating: 5,
        authToken: 'auth-token',
        addonID: fakeAddon.id,
        versionID: fakeAddon.current_version.id,
        ...customProps,
      });

      it('posts and dispatches the user rating', () => {
        const params = {
          rating: 5,
          authToken: 'auth-token',
          addonID: 123456,
          versionID: 321,
        };
        const ratingResponse = createRatingResponse({
          rating: params.rating,
        });

        mockApi
          .expects('callApi')
          .withArgs({
            endpoint: `addons/addon/${params.addonID}/reviews`,
            body: { rating: params.rating, version: params.versionID },
            method: 'post',
            auth: true,
            state: { token: params.authToken },
          })
          .returns(Promise.resolve(ratingResponse));

        return createRating(params).then(() => {
          assert.equal(dispatch.called, true);
          const action = dispatch.firstCall.args[0];

          assert.equal(action.type, SET_USER_RATING);
          assert.equal(action.data.addonID, params.addonID);
          assert.deepEqual(action.data.userRating, ratingResponse);

          mockApi.verify();
        });
      });

      it('throws API errors', () => {
        mockApi
          .expects('callApi')
          .returns(Promise.reject(new Error('API Error')));

        return createRating()
          .then(() => {
            assert.ok(false, 'unexpected success');
          })
          .catch((error) => {
            assert.match(error.message, /API Error/);
            mockApi.verify();
          });
      });
    });

    describe('mapStateToProps', () => {
      it('sets the authToken property from the state', () => {
        const props = mapStateToProps({ auth: { token: 'some-token' } });
        assert.equal(props.authToken, 'some-token');
      });

      it('sets an empty authToken when not signed in', () => {
        const props = mapStateToProps({});
        assert.equal(props.authToken, undefined);
      });
    });
  });
});
