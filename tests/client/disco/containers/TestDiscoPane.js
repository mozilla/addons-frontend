import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import { loadEntities } from 'core/actions';
import {
  EXTENSION_TYPE,
  INSTALL_STATE,
} from 'core/constants';
import { discoResults } from 'disco/actions';
import * as discoApi from 'disco/api';
import createStore from 'disco/store';
import {
  NAVIGATION_CATEGORY,
  VIDEO_CATEGORY,
  globalEvents,
} from 'disco/constants';
import * as helpers from 'disco/containers/DiscoPane';
import { getFakeI18nInst, MockedSubComponent } from 'tests/client/helpers';


// Use DiscoPane that isn't wrapped in asyncConnect.
const { DiscoPaneBase } = helpers;


describe('AddonPage', () => {
  function render(props) {
    const store = createStore({
      addons: { foo: { type: EXTENSION_TYPE } },
      discoResults: [{ addon: 'foo' }],
    });
    const results = [{ addon: 'foo', type: EXTENSION_TYPE }];
    const i18n = getFakeI18nInst();

    // We need the providers for i18n and since InstallButton will pull data from the store.
    return findDOMNode(renderIntoDocument(
      <DiscoPaneBase
        store={store} i18n={i18n} results={results} {...props}
        AddonComponent={MockedSubComponent} />
    ));
  }

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

    it('tracks video being played', () => {
      const fakeTracking = {
        sendEvent: sinon.stub(),
      };
      const root = render({ _tracking: fakeTracking });
      Simulate.click(root.querySelector('.play-video'));
      assert.ok(fakeTracking.sendEvent.calledWith({
        category: VIDEO_CATEGORY,
        action: 'play',
      }));
    });

    it('tracks video being closed', () => {
      const fakeTracking = {
        sendEvent: sinon.stub(),
      };
      const root = render({ _tracking: fakeTracking });
      Simulate.click(root.querySelector('.close-video a'));
      assert.ok(fakeTracking.sendEvent.calledWith({
        category: VIDEO_CATEGORY,
        action: 'close',
      }));
    });
  });

  describe('loadDataIfNeeded', () => {
    it('does nothing if there are loaded results', () => {
      const store = {
        getState() {
          return { addons: { foo: {} }, discoResults: [{ addon: 'foo' }] };
        },
      };
      const getAddons = sinon.stub(discoApi, 'getDiscoveryAddons');
      return helpers.loadDataIfNeeded({ store })
        .then(() => assert.notOk(getAddons.called));
    });

    it('loads the addons if there are none', () => {
      const api = { the: 'config' };
      const dispatch = sinon.spy();
      const store = {
        dispatch,
        getState() {
          return { addons: {}, api, discoResults: [] };
        },
      };
      const entities = {
        addons: {
          foo: {
            slug: 'foo',
          },
        },
        discoResults: {
          foo: {
            addon: 'foo',
          },
        },
      };
      const result = { results: ['foo'] };
      const getAddons = sinon.stub(discoApi, 'getDiscoveryAddons')
        .returns(Promise.resolve({ entities, result }));
      return helpers.loadDataIfNeeded({ store })
        .then(() => {
          assert.ok(getAddons.calledWith({ api }));
          assert.ok(dispatch.calledWith(loadEntities(entities)));
          assert.ok(dispatch.calledWith(discoResults([{ addon: 'foo' }])));
        });
    });
  });

  describe('mapStateToProps', () => {
    it('only sets results', () => {
      const props = helpers.mapStateToProps({
        discoResults: [],
        infoDialog: {
          show: false,
          data: {},
        },
      });
      assert.sameMembers(Object.keys(props),
        ['results', 'infoDialogData', 'showInfoDialog']);
    });

    it('sets the results', () => {
      const props = helpers.mapStateToProps({
        addons: { one: { slug: 'one' }, two: { slug: 'two' } },
        discoResults: [{ addon: 'two' }],
        infoDialog: {},
      });
      assert.deepEqual(props.results, [{ slug: 'two', addon: 'two' }]);
    });
  });

  describe('mapDispatchToProps', () => {
    it('calls dispatch when handleGlobalEvent is called with data', () => {
      const dispatch = sinon.spy();
      const { handleGlobalEvent } = helpers.mapDispatchToProps(dispatch);
      const payload = { id: 'whatever' };
      handleGlobalEvent(payload);
      assert.ok(dispatch.calledWith({ type: INSTALL_STATE, payload }));
    });

    it('is empty when there is no navigator', () => {
      const configStub = {
        get: sinon.stub().returns(true),
      };
      assert.deepEqual(
        helpers.mapDispatchToProps(sinon.spy(), { _config: configStub }), {});
    });
  });

  describe('componentDidMount', () => {
    it('sets events', () => {
      const fakeMozAddonManager = {
        addEventListener: sinon.stub(),
      };
      render({ mozAddonManager: fakeMozAddonManager });
      assert.equal(fakeMozAddonManager.addEventListener.callCount, globalEvents.length);
    });
  });

  describe('See more add-ons link', () => {
    it('tracks see more addons link being clicked', () => {
      const fakeTracking = {
        sendEvent: sinon.stub(),
      };
      const root = render({ _tracking: fakeTracking });
      Simulate.click(root.querySelector('.amo-link a'));
      assert.ok(fakeTracking.sendEvent.calledWith({
        category: NAVIGATION_CATEGORY,
        action: 'click',
        label: 'See More Add-ons',
      }));
    });
  });
});
