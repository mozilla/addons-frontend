import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { discoResults } from 'disco/actions';
import * as discoApi from 'disco/api';
import createStore from 'disco/store';
import { EXTENSION_TYPE } from 'disco/constants';
import * as helpers from 'disco/containers/DiscoPane';
import { stubAddonManager, getFakeI18nInst } from 'tests/client/helpers';
import { loadEntities } from 'core/actions';
import I18nProvider from 'core/i18n/Provider';

// Use DiscoPane that isn't wrapped in asyncConnect.
const { DiscoPane } = helpers;


describe('AddonPage', () => {
  beforeEach(() => {
    stubAddonManager();
  });

  function render() {
    const store = createStore({
      addons: {foo: {type: EXTENSION_TYPE}},
      discoResults: [{addon: 'foo'}],
    });
    const results = [{addon: 'foo', type: EXTENSION_TYPE}];
    const i18n = getFakeI18nInst();
    // We need the providers for i18n and since InstallButton will pull data from the store.
    return findDOMNode(renderIntoDocument(
      <I18nProvider i18n={i18n}>
        <Provider store={store} key="provider">
          <DiscoPane results={results} i18n={i18n} />
        </Provider>
      </I18nProvider>
    ));
  }

  describe('rendered fields', () => {
    it('renders an addon', () => {
      const root = render();
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
      const getAddons = sinon.stub(discoApi, 'getDiscoveryAddons');
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

  describe('mapStateToProps', () => {
    it('only sets results', () => {
      const props = helpers.mapStateToProps({discoResults: []});
      assert.deepEqual(Object.keys(props), ['results']);
    });

    it('sets the results', () => {
      const props = helpers.mapStateToProps({
        addons: {one: {slug: 'one'}, two: {slug: 'two'}},
        discoResults: [{addon: 'two'}],
      });
      assert.deepEqual(props.results, [{slug: 'two', addon: 'two'}]);
    });
  });
});
