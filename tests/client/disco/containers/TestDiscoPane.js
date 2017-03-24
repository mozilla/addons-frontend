import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';

import { loadEntities } from 'core/actions';
import {
  ADDON_TYPE_EXTENSION,
  GLOBAL_EVENTS,
  INSTALL_STATE,
} from 'core/constants';
import * as InfoDialog from 'core/containers/InfoDialog';
import { discoResults } from 'disco/actions';
import * as discoApi from 'disco/api';
import createStore from 'disco/store';
import {
  NAVIGATION_CATEGORY,
  VIDEO_CATEGORY,
} from 'disco/constants';
import * as helpers from 'disco/containers/DiscoPane';
import { getFakeI18nInst, MockedSubComponent } from 'tests/client/helpers';


// Use DiscoPane that isn't wrapped in asyncConnect.
const { DiscoPaneBase } = helpers;


describe('AddonPage', () => {
  let fakeVideo;
  let fakeTracking;

  beforeEach(() => {
    fakeTracking = { sendEvent: sinon.stub() };
    fakeVideo = { play: sinon.stub(), pause: sinon.stub() };
  });

  function render(props) {
    // Stub InfoDialog since it uses the store and is irrelevant.
    sinon.stub(InfoDialog, 'default', () => <p>InfoDialog</p>);
    const store = createStore({
      addons: { foo: { type: ADDON_TYPE_EXTENSION } },
      discoResults: [{ addon: 'foo' }],
    });
    const results = [{ addon: 'foo', type: ADDON_TYPE_EXTENSION }];
    const i18n = getFakeI18nInst();

    // We need providers because InstallButton will pull data from the store.
    return findDOMNode(renderIntoDocument(
      <DiscoPaneBase
        AddonComponent={MockedSubComponent}
        i18n={i18n}
        results={results}
        store={store}
        _tracking={fakeTracking}
        _video={fakeVideo}
        {...props}
      />
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
      const root = render();
      Simulate.click(root.querySelector('.play-video'));
      assert.ok(fakeTracking.sendEvent.calledWith({
        category: VIDEO_CATEGORY,
        action: 'play',
      }));
      assert.ok(fakeVideo.play.calledOnce);
    });

    it('tracks video being closed', () => {
      const root = render();
      Simulate.click(root.querySelector('.close-video a'));
      assert.ok(fakeTracking.sendEvent.calledWith({
        category: VIDEO_CATEGORY,
        action: 'close',
      }));
      assert.ok(fakeVideo.pause.calledOnce);
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
      });
      assert.sameMembers(Object.keys(props), ['results']);
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
      assert.equal(fakeMozAddonManager.addEventListener.callCount, GLOBAL_EVENTS.length);
    });
  });

  describe('See more add-ons link', () => {
    it('tracks see more addons link being clicked', () => {
      const root = render();
      Simulate.click(root.querySelector('.amo-link a'));
      assert.ok(fakeTracking.sendEvent.calledWith({
        category: NAVIGATION_CATEGORY,
        action: 'click',
        label: 'See More Add-ons',
      }));
    });
  });
});
