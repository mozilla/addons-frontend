import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { discoResults } from 'disco/actions';
import * as discoApi from 'disco/api';
import createStore from 'disco/store';
import { EXTENSION_TYPE } from 'disco/constants';
import DiscoPane, * as helpers from 'disco/containers/DiscoPane';
import { stubAddonManager, getFakeI18nInst } from 'tests/client/helpers';
import { loadEntities } from 'core/actions';
import I18nProvider from 'core/i18n/Provider';


describe('AddonPage', () => {
  beforeEach(() => {
    stubAddonManager();
  });

  function render() {
    const store = createStore({
      addons: {foo: {type: EXTENSION_TYPE}},
      discoResults: [{addon: 'foo'}],
    });
    return findDOMNode(renderIntoDocument(
      <I18nProvider i18n={getFakeI18nInst()}>
        <Provider store={store} key="provider">
          <DiscoPane />
        </Provider>
      </I18nProvider>
    ));
  }

  describe('rendered fields', () => {
    let root;

    beforeEach(() => {
      root = render();
    });

    it('renders an addon', () => {
      assert.ok(root.querySelector('.addon'));
    });
  });

  describe('video', () => {
    it('is small by default', () => {
      const root = render();
      assert.notOk(root.querySelector('.show-video'));
    });

    it('gets bigger and smaller when clicked', () => {
      const root = render();
      Simulate.click(root.querySelector('.play-video'));
      assert.ok(root.querySelector('.show-video'));
      Simulate.click(root.querySelector('.close-video a'));
      assert.notOk(root.querySelector('.show-video'));
    });
  });

  describe('loadDataIfNeeded', () => {
    it('does nothing if there are loaded results', () => {
      const store = {
        getState() {
          return {addons: {foo: {}}, discoResults: [{addon: 'foo'}]};
        },
      };
      const getAddons = sinon.spy(discoApi, 'getDiscoveryAddons');
      return helpers.loadDataIfNeeded({store})
        .then(() => assert.notOk(getAddons.called));
    });

    it('loads the addons if there are none', () => {
      const api = {the: 'config'};
      const dispatch = sinon.spy();
      const store = {
        dispatch,
        getState() {
          return {addons: {}, api, discoResults: []};
        },
      };
      const entities = {addons: {foo: {slug: 'foo'}}, discoResults: {foo: {addon: 'foo'}}};
      const result = {results: ['foo']};
      const getAddons = sinon.stub(discoApi, 'getDiscoveryAddons')
        .returns(Promise.resolve({entities, result}));
      return helpers.loadDataIfNeeded({store})
        .then(() => {
          assert.ok(getAddons.calledWith({api}));
          assert.ok(dispatch.calledWith(loadEntities(entities)));
          assert.ok(dispatch.calledWith(discoResults([{addon: 'foo'}])));
        });
    });
  });
});
