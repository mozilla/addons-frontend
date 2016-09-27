/* eslint-disable import/prefer-default-export */
import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import * as amoApi from 'amo/api';
import {
  mapDispatchToProps, mapStateToProps, OverallRatingBase,
} from 'amo/components/OverallRating';
import { SET_USER_RATING } from 'amo/constants';
import I18nProvider from 'core/i18n/Provider';
import {
  createRatingResponse, fakeAddon, signedInApiState,
} from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';

function render(customProps = {}) {
  const props = {
    addonName: fakeAddon.name,
    addonId: fakeAddon.id,
    apiState: signedInApiState,
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

describe('OverallRating', () => {
  function selectRating(root, selector) {
    const button = root.querySelector(selector);
    assert.ok(button, `No button returned for selector: ${selector}`);
    Simulate.click(button);
  }

  it('prompts you to rate the add-on by name', () => {
    const rootNode = render({ addonName: 'Some Add-on' });
    assert.include(rootNode.querySelector('legend').textContent,
                   'Some Add-on');
  });

  it('creates a rating with add-on and version info', () => {
    const createRating = sinon.stub();
    const root = render({
      createRating,
      apiState: { ...signedInApiState, token: 'new-token' },
      version: { id: 321 },
      addonId: 12345,
    });
    selectRating(root, '#OverallRating-love-it');
    assert.equal(createRating.called, true);

    const call = createRating.firstCall.args[0];
    assert.equal(call.versionID, 321);
    assert.equal(call.apiState.token, 'new-token');
    assert.equal(call.addonId, 12345);
  });

  it('lets you submit a "love it" rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, '#OverallRating-love-it');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 5);
  });

  it('lets you submit a "it is OK" rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, '#OverallRating-it-is-ok');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 3);
  });

  it('lets you submit a "huh?" rating', () => {
    const createRating = sinon.stub();
    const root = render({ createRating });
    selectRating(root, '#OverallRating-huh');
    assert.equal(createRating.called, true);
    assert.equal(createRating.firstCall.args[0].rating, 1);
  });

  it('prevents form submission when selecting a rating', () => {
    const root = render();

    const fakeEvent = {
      preventDefault: sinon.stub(),
      currentTarget: {},
    };
    const button = root.querySelector('#OverallRating-love-it');
    Simulate.click(button, fakeEvent);

    assert.equal(fakeEvent.preventDefault.called, true);
  });

  describe('mapDispatchToProps', () => {
    describe('createRating', () => {
      let mockApi;
      let dispatch;
      let actions;

      beforeEach(() => {
        mockApi = sinon.mock(amoApi);
        dispatch = sinon.stub();
        actions = mapDispatchToProps(dispatch);
      });

      it('posts the rating and dispatches the created rating', () => {
        const params = {
          rating: 5,
          apiState: { ...signedInApiState, token: 'new-token' },
          addonId: 123456,
          versionID: 321,
        };

        const ratingResponse = createRatingResponse({
          rating: params.rating,
        });

        mockApi
          .expects('postRating')
          .withArgs(params)
          .returns(Promise.resolve(ratingResponse));

        return actions.createRating(params).then(() => {
          assert.equal(dispatch.called, true);
          const action = dispatch.firstCall.args[0];

          assert.equal(action.type, SET_USER_RATING);
          assert.equal(action.data.addonId, params.addonId);
          assert.deepEqual(action.data.userRating, ratingResponse);

          mockApi.verify();
        });
      });
    });

    describe('mapStateToProps', () => {
      it('sets the apiState property from the state', () => {
        const apiState = { ...signedInApiState, token: 'new-token' };
        const props = mapStateToProps({ api: apiState });
        assert.deepEqual(props.apiState, apiState);
      });

      it('sets an empty apiState when not signed in', () => {
        const props = mapStateToProps({});
        assert.equal(props.apiState, undefined);
      });
    });
  });
});
