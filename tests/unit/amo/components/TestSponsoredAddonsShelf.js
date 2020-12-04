import { shallow } from 'enzyme';
import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import SponsoredAddonsShelf, {
  PROMOTED_ADDON_CLICK_ACTION,
  PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
  PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
  PROMOTED_ADDON_IMPRESSION_ACTION,
  SponsoredAddonsShelfBase,
} from 'amo/components/SponsoredAddonsShelf';
import { fetchHomeData, loadHomeData } from 'amo/reducers/home';
import {
  createInternalsponsoredShelf,
  fetchSponsored,
  loadSponsored,
} from 'amo/reducers/shelves';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import { ErrorHandler } from 'core/errorHandler';
import { setLang } from 'core/reducers/api';
import { formatDataForBeacon } from 'core/tracking';
import {
  createAddonsApiResult,
  createFakeTracking,
  createHeroShelves,
  createInternalAddonWithLang,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeEventData,
  fakeI18n,
  fakeSponsoredShelf,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let _sendBeacon;
  let _sendSponsoredEventBeacon;
  let _tracking;
  let store;

  beforeEach(() => {
    _sendBeacon = sinon.spy();
    _sendSponsoredEventBeacon = sinon.spy();
    _tracking = createFakeTracking();
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
      _sendBeacon,
      _sendSponsoredEventBeacon,
      _tracking,
      i18n: fakeI18n(),
      loading: false,
      store,
      ...customProps,
    };

    return shallowUntilTarget(
      <SponsoredAddonsShelf {...props} />,
      SponsoredAddonsShelfBase,
    );
  };

  const _loadPromotedExtensions = ({ addons = [] }) => {
    store.dispatch(setLang('en-US'));
    store.dispatch(
      loadHomeData({
        collections: [],
        heroShelves: createHeroShelves(),
        shelves: { promotedExtensions: createAddonsApiResult(addons) },
      }),
    );
  };

  const _loadPromotedShelf = ({
    addons = [],
    impressionData = 'some data',
    impressionURL = 'https://mozilla.org/',
  }) => {
    store.dispatch(setLang('en-US'));
    store.dispatch(
      loadSponsored({
        shelfData: {
          ...fakeSponsoredShelf,
          impression_data: impressionData,
          impression_url: impressionURL,
          results: addons,
        },
      }),
    );
  };

  const _createShelfData = ({
    addons = [fakeAddon],
    impressionData = 'some data',
    impressionURL = 'https://mozilla.org/',
  } = {}) => {
    return createInternalsponsoredShelf(
      {
        ...fakeSponsoredShelf,
        impression_data: impressionData,
        impression_url: impressionURL,
        results: addons,
      },
      'en-US',
    );
  };

  describe('When enableFeatureUseAdzerkForSponsoredShelf is false', () => {
    const _config = getFakeConfig({
      enableFeatureUseAdzerkForSponsoredShelf: false,
    });

    it('displays nothing when promotedExtensions is an empty array', () => {
      _loadPromotedExtensions({ addons: [] });
      const root = render({ _config });
      expect(root.find(AddonsCard)).toHaveLength(0);
    });

    it('passes loading parameter to AddonsCard', () => {
      store.dispatch(
        fetchHomeData({ collectionsToFetch: [], errorHandlerId: 'some-id' }),
      );

      let root = render({ _config });
      expect(root.find(AddonsCard)).toHaveProp('loading', true);

      _loadPromotedExtensions({ addons: [fakeAddon] });
      root = render({ _config });
      expect(root.find(AddonsCard)).toHaveProp('loading', false);
    });

    it('passes promotedExtensions to AddonsCard', () => {
      const addon = fakeAddon;
      _loadPromotedExtensions({ addons: [addon] });
      const root = render({ _config });

      expect(root.find(AddonsCard)).toHaveProp('addons', [
        createInternalAddonWithLang(addon),
      ]);
    });

    // See https://github.com/mozilla/addons-frontend/issues/9771
    it('includes all promoted extensions even if fewer than 6 are returned', () => {
      _loadPromotedExtensions({ addons: Array(5).fill(fakeAddon) });

      const root = render({ _config });

      const addons = root.find(AddonsCard).prop('addons');
      expect(addons.length).toEqual(5);
    });

    it('should not dispatch a fetch action', () => {
      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ _config });

      sinon.assert.notCalled(dispatchSpy);
    });

    // This is because errorHandler is only relevant if
    // enableFeatureUseAdzerkForSponsoredShelf is true.
    it('still renders, even if errorHandler has an error', () => {
      const errorHandler = new ErrorHandler({
        id: 'some-id',
        dispatch: store.dispatch,
      });
      errorHandler.handle(new Error('some unexpected error'));

      const root = render({ _config, errorHandler });
      expect(root.find(AddonsCard)).toHaveLength(1);
    });

    it('does not send a beacon for the impression on mount or update', () => {
      _loadPromotedExtensions({ addons: [fakeAddon] });
      const root = render({ _config });

      sinon.assert.notCalled(_sendBeacon);

      root.setProps({
        shelfData: _createShelfData({
          impressionData: 'some data',
          impressionURL: 'http://mozilla.org',
        }),
      });

      sinon.assert.notCalled(_sendBeacon);
    });

    it('does not send a beacon for the click', () => {
      const addon = { ...fakeAddon, event_data: fakeEventData };
      _loadPromotedExtensions({ addons: [addon] });

      const root = render({ _config });
      const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
      onAddonClick(createInternalAddonWithLang(addon));

      sinon.assert.notCalled(_sendSponsoredEventBeacon);
    });

    it('does not configure AddonsCard to store conversion data when an add-on is clicked', () => {
      const _storeConversionInfo = sinon.spy();
      const addon = { ...fakeAddon, event_data: fakeEventData };
      _loadPromotedExtensions({ addons: [addon] });

      const root = render({ _config, _storeConversionInfo });
      const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
      onAddonClick(createInternalAddonWithLang(addon));

      sinon.assert.notCalled(_storeConversionInfo);
    });
  });

  describe('When enableFeatureUseAdzerkForSponsoredShelf is true', () => {
    const _config = getFakeConfig({
      enableFeatureUseAdzerkForSponsoredShelf: true,
    });

    it('displays nothing when shelfData.results is an empty array', () => {
      _loadPromotedShelf({ addons: [] });
      const root = render({ _config });
      expect(root.find(AddonsCard)).toHaveLength(0);
    });

    it('passes loading parameter to AddonsCard', () => {
      store.dispatch(fetchSponsored({ errorHandlerId: 'some-id' }));

      let root = render({ _config });
      expect(root.find(AddonsCard)).toHaveProp('loading', true);

      _loadPromotedShelf({ addons: [fakeAddon] });
      root = render({ _config });
      expect(root.find(AddonsCard)).toHaveProp('loading', false);
    });

    it('passes shelfData.results to AddonsCard', () => {
      const addon = fakeAddon;
      _loadPromotedShelf({ addons: [addon] });
      const root = render({ _config });

      expect(root.find(AddonsCard)).toHaveProp('addons', [
        createInternalAddonWithLang(addon),
      ]);
    });

    // See https://github.com/mozilla/addons-frontend/issues/9771
    it('includes all promoted extensions even if fewer than 6 are returned', () => {
      _loadPromotedShelf({ addons: Array(5).fill(fakeAddon) });

      const root = render({ _config });

      const addons = root.find(AddonsCard).prop('addons');
      expect(addons.length).toEqual(5);
    });

    it('renders nothing if there is an error', () => {
      const errorHandler = new ErrorHandler({
        id: 'some-id',
        dispatch: store.dispatch,
      });
      errorHandler.handle(new Error('some unexpected error'));
      _loadPromotedShelf({ addons: [fakeAddon] });

      const root = render({ _config, errorHandler });
      expect(root.find(AddonsCard)).toHaveLength(0);
    });

    it('should dispatch a fetch action if shelfData is not loaded', () => {
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      render({ _config, errorHandler });

      sinon.assert.calledWith(
        dispatchSpy,
        fetchSponsored({
          errorHandlerId: errorHandler.id,
        }),
      );
    });

    it('should not dispatch a fetch action if shelfData is loading', () => {
      store.dispatch(fetchSponsored({ errorHandlerId: 'some-id' }));
      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ _config });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('should not dispatch a fetch action if shelfData is loaded', () => {
      _loadPromotedShelf({ addons: [fakeAddon] });
      const dispatchSpy = sinon.spy(store, 'dispatch');

      render({ _config });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('should dispatch a fetch action on update if shelfData is not loaded', () => {
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      _loadPromotedShelf({ addons: [fakeAddon] });
      const root = render({ _config, errorHandler });

      dispatchSpy.resetHistory();

      root.setProps({ shelfData: null });

      sinon.assert.calledWith(
        dispatchSpy,
        fetchSponsored({
          errorHandlerId: errorHandler.id,
        }),
      );
    });

    it('should not dispatch a fetch action on update if shelfData is loaded', () => {
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      const root = render({ _config, errorHandler });

      dispatchSpy.resetHistory();

      root.setProps({ shelfData: _createShelfData() });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('should not dispatch a fetch action on update if shelfData is loading', () => {
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      _loadPromotedShelf({ addons: [fakeAddon] });
      const root = render({ _config, errorHandler });

      dispatchSpy.resetHistory();

      root.setProps({ shelfData: null, isLoading: true });

      sinon.assert.notCalled(dispatchSpy);
    });

    it('sends a beacon for the impression on mount', () => {
      const impressionData = 'some data';
      const impressionURL = 'https://mozilla.org/';
      _loadPromotedShelf({
        addons: [fakeAddon],
        impressionData,
        impressionURL,
      });

      render({ _config });

      sinon.assert.calledWith(_sendBeacon, {
        data: formatDataForBeacon({
          data: impressionData,
          key: 'impression_data',
        }),
        urlString: impressionURL,
      });
    });

    it('sends a beacon for the impression on update', () => {
      const impressionData = 'some data';
      const impressionURL = 'https://mozilla.org/';

      const root = render({ _config });

      root.setProps({
        shelfData: _createShelfData({
          impressionData,
          impressionURL,
        }),
      });

      sinon.assert.calledWith(_sendBeacon, {
        data: formatDataForBeacon({
          data: impressionData,
          key: 'impression_data',
        }),
        urlString: impressionURL,
      });
    });

    it('does not send a beacon for the impression when shelfData is not loaded', () => {
      const root = render({ _config });

      root.setProps({ shelfData: null });
      sinon.assert.notCalled(_sendBeacon);
    });

    it('does not send a beacon for the impression when impression_data is missing', () => {
      const root = render({ _config });

      root.setProps({
        shelfData: _createShelfData({
          impressionData: null,
        }),
      });

      sinon.assert.notCalled(_sendBeacon);
    });

    it('does not send a beacon for the impression when impression_url is missing', () => {
      const root = render({ _config });

      root.setProps({
        shelfData: _createShelfData({
          impressionURL: null,
        }),
      });

      sinon.assert.notCalled(_sendBeacon);
    });

    it('configures AddonsCard to send a beacon when an add-on is clicked', () => {
      const clickData = 'test click data';
      const event_data = { ...fakeEventData, click: clickData };
      const addon = { ...fakeAddon, event_data };
      _loadPromotedShelf({ addons: [addon] });

      const root = render({ _config });
      const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
      onAddonClick(createInternalAddonWithLang(addon));

      sinon.assert.calledWith(_sendSponsoredEventBeacon, {
        data: clickData,
        type: 'click',
      });
    });

    it('does not configure AddonsCard to send a beacon when an add-on is clicked when event_data is missing', () => {
      const addon = { ...fakeAddon, event_data: undefined };
      _loadPromotedShelf({ addons: [addon] });

      const root = render({ _config });
      const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
      onAddonClick(createInternalAddonWithLang(addon));

      sinon.assert.notCalled(_sendSponsoredEventBeacon);
    });

    it('configures AddonsCard to store conversion data when an add-on is clicked', () => {
      const _storeConversionInfo = sinon.spy();
      const addonId = 12345;
      const data = 'test conversion data';
      const event_data = { ...fakeEventData, conversion: data };
      const addon = { ...fakeAddon, event_data, id: addonId };
      _loadPromotedShelf({ addons: [addon] });

      const root = render({ _config, _storeConversionInfo });
      const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
      onAddonClick(createInternalAddonWithLang(addon));

      sinon.assert.calledWith(_storeConversionInfo, {
        addonId: addon.id,
        data,
      });
    });

    it('does not configure AddonsCard to store conversion data when an add-on is clicked if event_data is empty', () => {
      const _storeConversionInfo = sinon.spy();
      const addon = { ...fakeAddon, event_data: undefined };
      _loadPromotedShelf({ addons: [addon] });

      const root = render({ _config, _storeConversionInfo });
      const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
      onAddonClick(createInternalAddonWithLang(addon));

      sinon.assert.notCalled(_storeConversionInfo);
    });
  });

  it('can pass a custom classname to AddonsCard', () => {
    const className = 'some-class-name';
    const root = render({ className });

    expect(root.find(AddonsCard)).toHaveClassName(className);
  });

  it('passes addonInstallSource to AddonsCard', () => {
    const addonInstallSource = 'featured-on-home-page';
    const addons = [createInternalAddonWithLang(fakeAddon)];
    const root = render({ addons, addonInstallSource });

    expect(root.find(AddonsCard)).toHaveProp(
      'addonInstallSource',
      addonInstallSource,
    );
  });

  it('uses the expected properties for the header link in AddonsCard', () => {
    const root = render();
    const headerProp = root.find(AddonsCard).prop('header');
    const header = shallow(<div>{headerProp}</div>);

    expect(header.find('.SponsoredAddonsShelf-headerLink')).toHaveProp(
      'rel',
      'noopener noreferrer',
    );
    expect(header.find('.SponsoredAddonsShelf-headerLink')).toHaveProp(
      'href',
      `${getPromotedBadgesLinkUrl({
        utm_content: 'promoted-addon-shelf',
      })}#sponsored`,
    );
  });

  it('configures AddonsCard to send a tracking event when an add-on is clicked', () => {
    const guid = 'some-guid';
    const addon = { ...fakeAddon, guid };
    _loadPromotedExtensions({ addons: [addon] });

    const root = render();
    const onAddonClick = root.find(AddonsCard).prop('onAddonClick');
    onAddonClick(createInternalAddonWithLang(addon));

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: PROMOTED_ADDON_CLICK_ACTION,
      category: PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
      label: guid,
    });
  });

  it('configures AddonsCard to send a tracking event when an add-on is displayed', () => {
    const guid = 'some-guid';
    const addon = { ...fakeAddon, guid };
    _loadPromotedExtensions({ addons: [addon] });

    const root = render();
    const onAddonImpression = root.find(AddonsCard).prop('onAddonImpression');
    onAddonImpression(createInternalAddonWithLang(addon));

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: PROMOTED_ADDON_IMPRESSION_ACTION,
      category: PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
      label: guid,
    });
  });
});
