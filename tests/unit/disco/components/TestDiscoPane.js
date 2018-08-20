import { mount } from 'enzyme';
import config from 'config';
import * as React from 'react';
import { Provider } from 'react-redux';

import {
  ADDON_TYPE_THEME,
  GLOBAL_EVENTS,
  INSTALL_STATE,
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
import { createInternalAddon } from 'core/reducers/addons';
import { getDiscoResults } from 'disco/actions';
import { NAVIGATION_CATEGORY } from 'disco/constants';
import DiscoPane, {
  DiscoPaneBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'disco/components/DiscoPane';
import createStore from 'disco/store';
import { makeQueryStringWithUTM } from 'disco/utils';
import {
  MockedSubComponent,
  createFakeLocation,
  createFakeTracking,
  createStubErrorHandler,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  fakeDiscoAddon,
  loadDiscoResultsIntoState,
} from 'tests/unit/disco/helpers';
import Button from 'ui/components/Button';
import ErrorList from 'ui/components/ErrorList';

describe(__filename, () => {
  let fakeTracking;

  beforeEach(() => {
    fakeTracking = createFakeTracking();
  });

  function renderProps(customProps = {}) {
    const i18n = fakeI18n();

    let results;
    if (typeof customProps.results === 'undefined') {
      const mappedProps = mapStateToProps(
        loadDiscoResultsIntoState([
          {
            heading: 'Discovery Addon 1',
            description: 'informative text',
            addon: {
              ...fakeDiscoAddon,
              guid: 'foo',
            },
          },
        ]),
      );
      results = mappedProps.results;
    }

    return {
      AddonComponent: MockedSubComponent,
      errorHandler: createStubErrorHandler(),
      dispatch: sinon.stub(),
      i18n,
      location: createFakeLocation(),
      match: {
        params: { platform: 'Darwin' },
      },
      results,
      store: createStore().store,
      _tracking: fakeTracking,
      ...customProps,
    };
  }

  function render(props = {}) {
    return shallowUntilTarget(
      <DiscoPane {...renderProps(props)} />,
      DiscoPaneBase,
    );
  }

  function renderAndMount(customProps = {}) {
    const { store, i18n, ...props } = renderProps(customProps);

    return mount(
      <Provider store={store}>
        <I18nProvider i18n={i18n}>
          <DiscoPane {...props} />
        </I18nProvider>
      </Provider>,
    );
  }

  describe('mapStateToProps', () => {
    it('sets extension results', () => {
      const addon = { ...fakeDiscoAddon };

      const props = mapStateToProps(
        loadDiscoResultsIntoState([
          {
            heading: 'The Add-on',
            description: 'editorial text',
            addon,
          },
        ]),
      );

      expect(props.results).toEqual([
        {
          ...addon,
          addon: addon.guid,
          description: 'editorial text',
          heading: 'The Add-on',
          iconUrl: addon.icon_url,
          platformFiles: {
            [OS_ALL]: fakeDiscoAddon.current_version.files[0],
            [OS_ANDROID]: undefined,
            [OS_LINUX]: undefined,
            [OS_MAC]: undefined,
            [OS_WINDOWS]: undefined,
          },
          isMozillaSignedExtension: false,
          isRestartRequired: false,
          isWebExtension: true,
        },
      ]);
    });

    it('sets theme results', () => {
      const addon = {
        ...fakeDiscoAddon,
        theme_data: {},
        type: ADDON_TYPE_THEME,
      };

      const props = mapStateToProps(
        loadDiscoResultsIntoState([
          {
            heading: 'The Theme',
            description: 'editorial text',
            addon,
          },
        ]),
      );

      // Adjust the theme guid to match how Firefox code does it internally.
      const guid = '1234@personas.mozilla.org';

      expect(props.results).toEqual([
        {
          ...createInternalAddon(addon),
          addon: guid,
          description: 'editorial text',
          guid,
          heading: 'The Theme',
        },
      ]);
    });
  });

  describe('mapDispatchToProps', () => {
    it('calls dispatch when handleGlobalEvent is called with data', () => {
      const dispatch = sinon.spy();
      sinon
        .stub(config, 'get')
        .withArgs('server')
        .returns(false);
      const { handleGlobalEvent } = mapDispatchToProps(dispatch);
      const payload = { id: 'whatever' };
      handleGlobalEvent(payload);
      sinon.assert.calledWith(dispatch, { type: INSTALL_STATE, payload });
    });
  });

  describe('constructor', () => {
    let store;

    beforeEach(() => {
      store = createStore().store;
    });

    it('gets discovery results when results are empty', () => {
      const dispatch = sinon.spy(store, 'dispatch');
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });

      render({ errorHandler, store });

      sinon.assert.calledWith(
        dispatch,
        getDiscoResults({
          errorHandlerId: errorHandler.id,
          taarParams: { platform: 'Darwin' },
        }),
      );
    });

    it('sends a telemetry client ID if there is one', () => {
      const location = createFakeLocation({
        query: {
          clientId: 'telemetry-client-id',
        },
      });
      const dispatch = sinon.spy(store, 'dispatch');
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });

      render({ errorHandler, location, store });

      sinon.assert.calledWith(
        dispatch,
        getDiscoResults({
          errorHandlerId: errorHandler.id,
          taarParams: {
            clientId: location.query.clientId,
            platform: 'Darwin',
          },
        }),
      );
    });

    it('dispatches all query params', () => {
      const location = createFakeLocation({
        query: {
          branch: 'foo',
          clientId: 'telemetry-client-id',
          study: 'bar',
        },
      });
      const dispatch = sinon.spy(store, 'dispatch');
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });

      render({ errorHandler, location, store });

      sinon.assert.calledWith(
        dispatch,
        getDiscoResults({
          errorHandlerId: errorHandler.id,
          taarParams: {
            branch: 'foo',
            clientId: location.query.clientId,
            platform: 'Darwin',
            study: 'bar',
          },
        }),
      );
    });

    it('does not allow platform to be overriden', () => {
      const location = createFakeLocation({
        query: {
          platform: 'bar',
        },
      });
      const dispatch = sinon.spy(store, 'dispatch');
      const errorHandler = new ErrorHandler({ id: 'some-id', dispatch });

      render({ errorHandler, location, store });

      sinon.assert.calledWith(
        dispatch,
        getDiscoResults({
          errorHandlerId: errorHandler.id,
          taarParams: { platform: 'Darwin' },
        }),
      );
    });

    it('does not get discovery results when results are loaded', () => {
      const dispatch = sinon.spy(store, 'dispatch');

      loadDiscoResultsIntoState(
        [
          {
            heading: 'Discovery Addon 1',
            description: 'informative text',
            addon: {
              ...fakeDiscoAddon,
              guid: '@guid1',
              slug: 'discovery-addon-1',
            },
          },
        ],
        { store },
      );
      dispatch.resetHistory();

      render({ store });

      sinon.assert.notCalled(dispatch);
    });

    it('does not get results if there was an error', () => {
      const dispatch = sinon.spy(store, 'dispatch');

      const errorHandler = new ErrorHandler({
        id: 'some-id',
        dispatch,
        capturedError: new Error('some API error'),
      });

      loadDiscoResultsIntoState([], { store });
      dispatch.resetHistory();

      render({ errorHandler, store });

      sinon.assert.notCalled(dispatch);
    });
  });

  describe('componentDidMount', () => {
    it('does not set events on the server', () => {
      const _config = getFakeConfig({ server: true });
      const fakeMozAddonManager = {
        addEventListener: sinon.stub(),
      };

      renderAndMount({ _config, mozAddonManager: fakeMozAddonManager });
      sinon.assert.notCalled(fakeMozAddonManager.addEventListener);
    });

    it('sets events on the client', () => {
      const _config = getFakeConfig({ server: false });
      const fakeMozAddonManager = {
        addEventListener: sinon.stub(),
      };

      renderAndMount({ _config, mozAddonManager: fakeMozAddonManager });
      sinon.assert.callCount(
        fakeMozAddonManager.addEventListener,
        GLOBAL_EVENTS.length,
      );
    });
  });

  describe('errors', () => {
    it('renders errors', () => {
      const errorHandler = createStubErrorHandler(new Error('some error'));
      const root = render({ errorHandler });

      expect(root.find(ErrorList)).toHaveLength(1);
    });
  });

  describe('Find more add-ons links', () => {
    it.each(['bottom', 'top'])(
      'shows a "find more add-ons" link with UTM params on the %s of the page',
      (position) => {
        const root = render();
        const button = root.find(`.amo-link-${position}`).find(Button);

        expect(button).toHaveLength(1);
        expect(button).toHaveProp(
          'href',
          `https://addons.mozilla.org/${makeQueryStringWithUTM({
            utm_content: `find-more-link-${position}`,
            src: 'api',
          })}`,
        );
      },
    );

    it.each(['bottom', 'top'])(
      'tracks the %s "find more add-ons" link being clicked',
      (position) => {
        const root = render();

        root
          .find(`.amo-link-${position}`)
          .find(Button)
          .simulate('click');

        sinon.assert.calledWith(fakeTracking.sendEvent, {
          category: NAVIGATION_CATEGORY,
          action: 'click',
          label: 'Find More Add-ons',
        });
      },
    );
  });
});
