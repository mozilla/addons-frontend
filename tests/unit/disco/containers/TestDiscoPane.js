import { mount, shallow } from 'enzyme';
import config from 'config';
import React from 'react';
import { Provider } from 'react-redux';

import { loadEntities } from 'core/actions';
import {
  ADDON_TYPE_EXTENSION,
  GLOBAL_EVENTS,
  INSTALL_STATE,
} from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
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

const fakeEvent = {
  preventDefault: sinon.stub(),
};


describe('AddonPage', () => {
  let fakeVideo;
  let fakeTracking;

  beforeEach(() => {
    fakeTracking = { sendEvent: sinon.stub() };
    fakeVideo = { play: sinon.stub(), pause: sinon.stub() };
  });

  function renderProps(customProps = {}) {
    const results = [{ addon: 'foo', type: ADDON_TYPE_EXTENSION }];
    const i18n = getFakeI18nInst();

    return {
      AddonComponent: MockedSubComponent,
      i18n,
      results,
      _tracking: fakeTracking,
      _video: fakeVideo,
      ...customProps,
    };
  }

  function render(props = {}) {
    return shallow(<DiscoPaneBase {...renderProps(props)} />);
  }

  function renderAndMount(customProps = {}) {
    const { store } = createStore({
      addons: { foo: { type: ADDON_TYPE_EXTENSION } },
      discoResults: [{ addon: 'foo' }],
    });
    const props = renderProps(customProps);
    return mount(
      <Provider store={store}>
        <I18nProvider i18n={props.i18n}>
          <DiscoPaneBase {...props} />
        </I18nProvider>
      </Provider>
    );
  }

  describe('video', () => {
    it('is small by default', () => {
      const root = render();
      expect(root.find('.show-video')).toHaveLength(0);
    });

    it('gets bigger and smaller when clicked', () => {
      const root = render();
      root.find('.play-video').simulate('click', fakeEvent);
      expect(root.find('.show-video')).toHaveLength(1);
      root.find('.close-video a').simulate('click', fakeEvent);
      expect(root.find('.show-video')).toHaveLength(0);
    });

    it('tracks video being played', () => {
      const root = render();
      root.find('.play-video').simulate('click', fakeEvent);
      sinon.assert.calledWith(fakeTracking.sendEvent, {
        category: VIDEO_CATEGORY,
        action: 'play',
      });
      sinon.assert.calledOnce(fakeVideo.play);
    });

    it('tracks video being closed', () => {
      const root = render();
      root.find('.close-video a').simulate('click', fakeEvent);
      sinon.assert.calledWith(fakeTracking.sendEvent, {
        category: VIDEO_CATEGORY,
        action: 'close',
      });
      sinon.assert.calledOnce(fakeVideo.pause);
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
      renderAndMount({ mozAddonManager: fakeMozAddonManager });
      expect(fakeMozAddonManager.addEventListener.callCount).toEqual(GLOBAL_EVENTS.length);
    });
  });

  describe('See more add-ons link', () => {
    it('tracks see more addons link being clicked', () => {
      const root = render();
      root.find('.amo-link a').simulate('click');
      sinon.assert.calledWith(fakeTracking.sendEvent, {
        category: NAVIGATION_CATEGORY,
        action: 'click',
        label: 'See More Add-ons',
      });
    });
  });
});
