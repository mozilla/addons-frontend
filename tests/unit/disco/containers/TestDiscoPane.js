import { mount, shallow } from 'enzyme';
import config from 'config';
import React from 'react';
import { Provider } from 'react-redux';

import {
  ADDON_TYPE_THEME,
  GLOBAL_EVENTS,
  INSTALL_STATE,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
import { createInternalAddon } from 'core/reducers/addons';
import { getDiscoResults } from 'disco/actions';
import createStore from 'disco/store';
import {
  NAVIGATION_CATEGORY,
  VIDEO_CATEGORY,
} from 'disco/constants';
import * as helpers from 'disco/containers/DiscoPane';
import {
  createFakeEvent,
  createStubErrorHandler,
  fakeI18n,
  MockedSubComponent,
} from 'tests/unit/helpers';
import {
  fakeDiscoAddon,
  loadDiscoResultsIntoState,
} from 'tests/unit/disco/helpers';
import Button from 'ui/components/Button';
import ErrorList from 'ui/components/ErrorList';

// Use DiscoPane that isn't wrapped in asyncConnect.
const { DiscoPaneBase } = helpers;


describe(__filename, () => {
  let fakeEvent;
  let fakeVideo;
  let fakeTracking;

  beforeEach(() => {
    fakeEvent = createFakeEvent();
    fakeTracking = { sendEvent: sinon.stub() };
    fakeVideo = { play: sinon.stub(), pause: sinon.stub() };
  });

  function renderProps(customProps = {}) {
    const i18n = fakeI18n();

    let results;
    if (typeof customProps.results === 'undefined') {
      const mappedProps = helpers.mapStateToProps(loadDiscoResultsIntoState([{
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon: {
          ...fakeDiscoAddon,
          guid: 'foo',
        },
      }]));
      results = mappedProps.results;
    }

    return {
      AddonComponent: MockedSubComponent,
      errorHandler: createStubErrorHandler(),
      dispatch: sinon.stub(),
      i18n,
      location: { query: {} },
      params: { platform: 'Darwin' },
      results,
      _tracking: fakeTracking,
      _video: fakeVideo,
      ...customProps,
    };
  }

  function render(props = {}) {
    return shallow(<DiscoPaneBase {...renderProps(props)} />, {
      params: { platform: 'Darwin' },
    });
  }

  function renderAndMount(customProps = {}) {
    const { store } = createStore();
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
      expect(root.find('header')).not.toHaveClassName('.show-video');
    });

    it('gets bigger and smaller when clicked', () => {
      const root = render();
      root.find('.play-video').simulate('click', fakeEvent);
      expect(root.find('header')).toHaveClassName('.show-video');
      root.find('.close-video a').simulate('click', fakeEvent);
      expect(root.find('header')).not.toHaveClassName('.show-video');
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

  describe('mapStateToProps', () => {
    it('sets extension results', () => {
      const addon = { ...fakeDiscoAddon };

      const props = helpers.mapStateToProps(loadDiscoResultsIntoState([{
        heading: 'The Add-on',
        description: 'editorial text',
        addon,
      }]));

      expect(props.results).toEqual([{
        ...addon,
        addon: addon.guid,
        description: 'editorial text',
        heading: 'The Add-on',
        iconUrl: addon.icon_url,
        installURLs: {
          all: 'https://a.m.o/files/321/addon.xpi',
          android: undefined,
          linux: undefined,
          mac: undefined,
          windows: undefined,
        },
        isMozillaSignedExtension: false,
        isRestartRequired: false,
        isWebExtension: true,
      }]);
    });

    it('sets theme results', () => {
      const addon = {
        ...fakeDiscoAddon,
        theme_data: {},
        type: ADDON_TYPE_THEME,
      };

      const props = helpers.mapStateToProps(loadDiscoResultsIntoState([{
        heading: 'The Theme',
        description: 'editorial text',
        addon,
      }]));

      // Adjust the theme guid to match how Firefox code does it internally.
      const guid = '1234@personas.mozilla.org';

      expect(props.results).toEqual([{
        ...createInternalAddon(addon),
        addon: guid,
        description: 'editorial text',
        guid,
        heading: 'The Theme',
      }]);
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
    it('gets discovery results when results are empty', () => {
      const dispatch = sinon.stub();
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });
      const props = helpers.mapStateToProps(loadDiscoResultsIntoState([]));

      render({ errorHandler, dispatch, ...props });

      sinon.assert.calledWith(dispatch, getDiscoResults({
        errorHandlerId: errorHandler.id,
        taarParams: { platform: 'Darwin' },
      }));
    });

    it('sends a telemetry client ID if there is one', () => {
      const location = {
        query: {
          clientId: 'telemetry-client-id',
        },
      };
      const dispatch = sinon.stub();
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });
      // Set up some empty results so that the component fetches new ones.
      const props = helpers.mapStateToProps(loadDiscoResultsIntoState([]));

      render({ errorHandler, dispatch, location, ...props });

      sinon.assert.calledWith(dispatch, getDiscoResults({
        errorHandlerId: errorHandler.id,
        taarParams: {
          clientId: location.query.clientId,
          platform: 'Darwin',
        },
      }));
    });

    it('dispatches all query params', () => {
      const location = {
        query: {
          branch: 'foo',
          clientId: 'telemetry-client-id',
          study: 'bar',
        },
      };
      const dispatch = sinon.stub();
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });
      // Set up some empty results so that the component fetches new ones.
      const props = helpers.mapStateToProps(loadDiscoResultsIntoState([]));

      render({ errorHandler, dispatch, location, ...props });

      sinon.assert.calledWith(dispatch, getDiscoResults({
        errorHandlerId: errorHandler.id,
        taarParams: {
          branch: 'foo',
          clientId: location.query.clientId,
          platform: 'Darwin',
          study: 'bar',
        },
      }));
    });

    it('does not allow platform to be overriden', () => {
      const location = {
        query: {
          platform: 'bar',
        },
      };
      const dispatch = sinon.stub();
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });
      // Set up some empty results so that the component fetches new ones.
      const props = helpers.mapStateToProps(loadDiscoResultsIntoState([]));

      render({ errorHandler, dispatch, location, ...props });

      sinon.assert.calledWith(dispatch, getDiscoResults({
        errorHandlerId: errorHandler.id,
        taarParams: { platform: 'Darwin' },
      }));
    });

    it('does not get discovery results when results are loaded', () => {
      const dispatch = sinon.stub();
      const props = helpers.mapStateToProps(loadDiscoResultsIntoState([{
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon: {
          ...fakeDiscoAddon,
          guid: '@guid1',
          slug: 'discovery-addon-1',
        },
      }]));

      render({ dispatch, ...props });

      sinon.assert.notCalled(dispatch);
    });

    it('does not get results if there was an error', () => {
      const dispatch = sinon.stub();
      const errorHandler = new ErrorHandler({
        id: 'some-id',
        dispatch,
        capturedError: new Error('some API error'),
      });
      const props = helpers.mapStateToProps(loadDiscoResultsIntoState([]));

      render({ errorHandler, dispatch, ...props });

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
      const errorHandler = createStubErrorHandler(new Error('some error'));
      const root = render({ errorHandler });

      expect(root.find(ErrorList)).toHaveLength(1);
    });
  });

  describe('See more add-ons link', () => {
    it('tracks see more addons link being clicked', () => {
      const root = render();

      root.find('.amo-link').find(Button).simulate('click');
      sinon.assert.calledWith(fakeTracking.sendEvent, {
        category: NAVIGATION_CATEGORY,
        action: 'click',
        label: 'See More Add-ons',
      });
    });
  });
});
