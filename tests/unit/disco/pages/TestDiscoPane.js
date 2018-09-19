import { mount } from 'enzyme';
import config from 'config';
import * as React from 'react';
import { Provider } from 'react-redux';

import { GLOBAL_EVENTS, INSTALL_STATE } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
import { NAVIGATION_CATEGORY } from 'disco/constants';
import DiscoPane, {
  DiscoPaneBase,
  mapDispatchToProps,
} from 'disco/pages/DiscoPane';
import { getDiscoResults } from 'disco/reducers/discoResults';
import createStore from 'disco/store';
import { makeQueryStringWithUTM } from 'disco/utils';
import {
  createFakeLocation,
  createFakeTracking,
  createStubErrorHandler,
  fakeI18n,
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
    return {
      _tracking: fakeTracking,
      dispatch: sinon.stub(),
      errorHandler: createStubErrorHandler(),
      i18n: fakeI18n(),
      location: createFakeLocation(),
      match: {
        params: { platform: 'Darwin' },
      },
      store: createStore().store,
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
    it('sets events', () => {
      const fakeMozAddonManager = {
        addEventListener: sinon.stub(),
      };

      renderAndMount({ mozAddonManager: fakeMozAddonManager });
      sinon.assert.callCount(
        fakeMozAddonManager.addEventListener,
        // + 1 because of onOperationCancelled that is registered separately.
        GLOBAL_EVENTS.length + 1,
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
