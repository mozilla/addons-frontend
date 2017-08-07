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
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
import { getDiscoResults, discoResults } from 'disco/actions';
import * as discoApi from 'disco/api';
import createStore from 'disco/store';
import {
  NAVIGATION_CATEGORY,
  VIDEO_CATEGORY,
} from 'disco/constants';
import * as helpers from 'disco/containers/DiscoPane';
import { fakeAddon } from 'tests/unit/amo/helpers';
import { getFakeI18nInst, MockedSubComponent } from 'tests/unit/helpers';
import {
  createFakeEvent, createFetchDiscoveryResult,
} from 'tests/unit/disco/helpers';
import ErrorList from 'ui/components/ErrorList';


// Use DiscoPane that isn't wrapped in asyncConnect.
const { DiscoPaneBase } = helpers;


describe('AddonPage', () => {
  let fakeEvent;
  let fakeVideo;
  let fakeTracking;

  beforeEach(() => {
    fakeEvent = createFakeEvent();
    fakeTracking = { sendEvent: sinon.stub() };
    fakeVideo = { play: sinon.stub(), pause: sinon.stub() };
  });

  function renderProps(customProps = {}) {
    const results = [{ addon: 'foo', type: ADDON_TYPE_EXTENSION }];
    const i18n = getFakeI18nInst();

    return {
      AddonComponent: MockedSubComponent,
      errorHandler: new ErrorHandler({
        id: 'some-id', dispatch: sinon.stub(),
      }),
      dispatch: sinon.stub(),
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
    // TODO: fix this to use real dispatches.
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
      sinon.assert.calledWith(dispatch, { type: INSTALL_STATE, payload });
    });

    it('does not pass handleGlobalEvent when on the server', () => {
      const dispatch = sinon.stub();
      const configSource = { server: true };
      const configStub = { get: (key) => configSource[key] };
      expect(helpers.mapDispatchToProps(dispatch, { _config: configStub }))
        .toEqual({ dispatch });
    });
  });

  describe('constructor', () => {
    it('gets discovery results when results are 0 length', () => {
      const dispatch = sinon.stub();
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });
      const { store } = createStore();
      const props = helpers.mapStateToProps(store.getState());

      render({ errorHandler, dispatch, ...props });

      sinon.assert.calledWith(dispatch, getDiscoResults({
        errorHandlerId: errorHandler.id,
      }));
    });

    it('does not get discovery results when results are loaded', () => {
      const dispatch = sinon.stub();
      const { store } = createStore();

      const addon = {
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon: {
          ...fakeAddon,
          guid: '@guid1',
          slug: 'discovery-addon-1',
        },
      };
      const { entities, result } = createFetchDiscoveryResult([addon]);
      store.dispatch(loadEntities({ entities, result }));
      store.dispatch(discoResults(
        result.results.map((r) => entities.discoResults[r])
      ));
      const props = helpers.mapStateToProps(store.getState());

      render({ dispatch, ...props });

      sinon.assert.notCalled(dispatch);
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

  describe('errors', () => {
    it('renders errors', () => {
      const errorHandler = new ErrorHandler({
        id: 'some-handler',
        dispatch: sinon.stub(),
        capturedError: new Error('some error'),
      });
      const root = render({ errorHandler });

      expect(root.find(ErrorList)).toHaveLength(1);
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
