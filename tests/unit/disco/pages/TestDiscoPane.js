import { mount } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { setLang } from 'core/actions';
import {
  DISCO_NAVIGATION_CATEGORY,
  GLOBAL_EVENTS,
  INSTALL_STATE,
} from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
import DiscoPane, {
  DiscoPaneBase,
  mapDispatchToProps,
} from 'disco/pages/DiscoPane';
import { getDiscoResults } from 'disco/reducers/discoResults';
import { setHashedClientId } from 'disco/reducers/telemetry';
import createStore from 'disco/store';
import { makeQueryStringWithUTM } from 'disco/utils';
import { genericType } from 'ui/components/Notice';
import {
  createFakeLocation,
  createFakeTracking,
  createStubErrorHandler,
  fakeI18n,
  getFakeLogger,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import {
  createDiscoResult,
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
        params: { platform: 'Darwin', version: '66.0' },
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
      const version = '65.0.1';
      const platform = 'Linux';
      const match = { params: { platform, version } };

      const clientId = '1112';
      store.dispatch(setHashedClientId(clientId));
      const dispatch = sinon.spy(store, 'dispatch');

      const root = render({ store, match });

      sinon.assert.calledWith(
        dispatch,
        getDiscoResults({
          errorHandlerId: root.instance().props.errorHandler.id,
          taarParams: {
            clientId,
            platform,
          },
        }),
      );
    });

    // See: https://github.com/mozilla/addons-frontend/issues/7573
    it('does not send a telemetry client ID when version is < 65.0.1', () => {
      const version = '65.0';
      const platform = 'Linux';
      const match = { params: { platform, version } };

      const clientId = '1112';
      store.dispatch(setHashedClientId(clientId));
      const dispatch = sinon.spy(store, 'dispatch');

      const _log = getFakeLogger();

      const root = render({ _log, store, match });

      sinon.assert.calledWith(
        dispatch,
        getDiscoResults({
          errorHandlerId: root.instance().props.errorHandler.id,
          taarParams: {
            platform,
          },
        }),
      );
      sinon.assert.calledWith(
        _log.debug,
        `Not passing the client ID to the API because the browser version (%s) is < 65.0.1`,
        version,
      );
    });

    it('dispatches all query params', () => {
      const location = createFakeLocation({
        query: {
          branch: 'foo',
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
        const button = root
          .find(`.DiscoPane-amo-link-${position}`)
          .find(Button);

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
          .find(`.DiscoPane-amo-link-${position}`)
          .find(Button)
          .simulate('click');

        sinon.assert.calledWith(fakeTracking.sendEvent, {
          category: DISCO_NAVIGATION_CATEGORY,
          action: 'click',
          label: 'Find More Add-ons',
        });
      },
    );
  });

  describe('Notice about recommendations', () => {
    let store;

    beforeEach(() => {
      store = createStore().store;
    });

    it('does not show a Notice when there are no recommended results', () => {
      loadDiscoResultsIntoState(
        [createDiscoResult({ is_recommendation: false })],
        { store },
      );

      const root = render({ store });

      expect(root.find('.DiscoPane-notice-recommendations')).toHaveLength(0);
    });

    it('shows a Notice when there are recommended results', () => {
      const lang = 'fr';
      const platform = 'Linux';
      const version = '65.0';
      const match = { params: { platform, version } };

      store.dispatch(setLang(lang));

      loadDiscoResultsIntoState(
        [createDiscoResult({ is_recommendation: true })],
        { store },
      );

      const root = render({ store, match });

      const notice = root.find('.DiscoPane-notice-recommendations');
      expect(notice).toHaveLength(1);
      expect(notice).toHaveProp(
        'actionHref',
        `https://support.mozilla.org/1/firefox/${version}/${platform}/${lang}/personalized-addons`,
      );
      expect(notice).toHaveProp('actionTarget', '_blank');
      expect(notice).toHaveProp('actionText', 'Learn More');
      expect(notice).toHaveProp('type', genericType);
      expect(notice.childAt(0)).toIncludeText('Some of these recommendations');
    });
  });
});
