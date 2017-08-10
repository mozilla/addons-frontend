import config from 'config';
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
import { getFakeI18nInst, MockedSubComponent } from 'tests/unit/helpers';


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
    sinon.stub(InfoDialog, 'default').callsFake(() => <p>InfoDialog</p>);
    const { store } = createStore({
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
      expect(root.querySelector('.show-video')).toBeFalsy();
    });

    it('gets bigger and smaller when clicked', () => {
      const root = render();
      Simulate.click(root.querySelector('.play-video'));
      expect(root.querySelector('.show-video')).toBeTruthy();
      Simulate.click(root.querySelector('.close-video a'));
      expect(root.querySelector('.show-video')).toBeFalsy();
    });

    it('tracks video being played', () => {
      const root = render();
      Simulate.click(root.querySelector('.play-video'));
      expect(fakeTracking.sendEvent.calledWith({
        category: VIDEO_CATEGORY,
        action: 'play',
      })).toBeTruthy();
      expect(fakeVideo.play.calledOnce).toBeTruthy();
    });

    it('tracks video being closed', () => {
      const root = render();
      Simulate.click(root.querySelector('.close-video a'));
      expect(fakeTracking.sendEvent.calledWith({
        category: VIDEO_CATEGORY,
        action: 'close',
      })).toBeTruthy();
      expect(fakeVideo.pause.calledOnce).toBeTruthy();
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
        .then(() => expect(getAddons.called).toBeFalsy());
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
          expect(getAddons.calledWith({ api })).toBeTruthy();
          expect(dispatch.calledWith(loadEntities(entities))).toBeTruthy();
          expect(dispatch.calledWith(discoResults([{ addon: 'foo' }]))).toBeTruthy();
        });
    });
  });

  describe('mapStateToProps', () => {
    it('only sets results', () => {
      const props = helpers.mapStateToProps({
        discoResults: [],
      });
      expect(Object.keys(props)).toEqual(['results']);
    });

    it('sets the results', () => {
      const props = helpers.mapStateToProps({
        addons: { one: { slug: 'one' }, two: { slug: 'two' } },
        discoResults: [{ addon: 'two' }],
        infoDialog: {},
      });
      expect(props.results).toEqual([{ slug: 'two', addon: 'two' }]);
    });
  });

  describe('mapDispatchToProps', () => {
    it('calls dispatch when handleGlobalEvent is called with data', () => {
      const dispatch = sinon.spy();
      sinon.stub(config, 'get').withArgs('server').returns(false);
      const { handleGlobalEvent } = helpers.mapDispatchToProps(dispatch);
      const payload = { id: 'whatever' };
      handleGlobalEvent(payload);
      expect(dispatch.calledWith({ type: INSTALL_STATE, payload })).toBeTruthy();
    });

    it('is empty when there is no navigator', () => {
      const configStub = {
        get: sinon.stub().returns(true),
      };
      expect(helpers.mapDispatchToProps(sinon.spy(), { _config: configStub })).toEqual({});
    });
  });

  describe('componentDidMount', () => {
    it('sets events', () => {
      const fakeMozAddonManager = {
        addEventListener: sinon.stub(),
      };
      render({ mozAddonManager: fakeMozAddonManager });
      expect(fakeMozAddonManager.addEventListener.callCount).toEqual(GLOBAL_EVENTS.length);
    });
  });

  describe('See more add-ons link', () => {
    it('tracks see more addons link being clicked', () => {
      const root = render();
      Simulate.click(root.querySelector('.amo-link a'));
      expect(fakeTracking.sendEvent.calledWith({
        category: NAVIGATION_CATEGORY,
        action: 'click',
        label: 'See More Add-ons',
      })).toBeTruthy();
    });
  });
});
