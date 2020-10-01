import { shallow } from 'enzyme';
import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import SponsoredAddonsShelf, {
  PROMOTED_ADDON_CLICK_ACTION,
  PROMOTED_ADDON_HOMEPAGE_CLICK_CATEGORY,
  PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
  PROMOTED_ADDON_IMPRESSION_ACTION,
  SponsoredAddonsShelfBase,
  formatDataForBeacon,
} from 'amo/components/SponsoredAddonsShelf';
import { fetchHomeData, loadHomeData } from 'amo/reducers/home';
import {
  createInternalsponsoredShelf,
  fetchSponsored,
  loadSponsored,
} from 'amo/reducers/shelves';
import { getPromotedBadgesLinkUrl } from 'amo/utils';
import { ErrorHandler } from 'core/errorHandler';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createAddonsApiResult,
  createFakeTracking,
  createHeroShelves,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeSponsoredShelf,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let _tracking;
  let store;

  beforeEach(() => {
    _tracking = createFakeTracking();
    store = dispatchClientMetadata().store;
  });

  const render = (customProps = {}) => {
    const props = {
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
  }) => {
    return createInternalsponsoredShelf({
      ...fakeSponsoredShelf,
      impression_data: impressionData,
      impression_url: impressionURL,
      results: addons,
    });
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
        createInternalAddon(addon),
      ]);
    });

    it('only includes 3 promoted extensions if fewer than 6 are returned', () => {
      _loadPromotedExtensions({ addons: Array(5).fill(fakeAddon) });

      const root = render({ _config });

      const addons = root.find(AddonsCard).prop('addons');
      expect(addons.length).toEqual(3);
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
      const _navigator = { sendBeacon: sinon.spy() };
      const root = render({ _config, _navigator });

      sinon.assert.notCalled(_navigator.sendBeacon);

      root.setProps({
        shelfData: _createShelfData({
          impressionData: 'some data',
          impressionURL: 'http://mozilla.org',
        }),
      });

      sinon.assert.notCalled(_navigator.sendBeacon);
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
        createInternalAddon(addon),
      ]);
    });

    it('only includes 3 promoted extensions if fewer than 6 are returned', () => {
      _loadPromotedShelf({ addons: Array(5).fill(fakeAddon) });

      const root = render({ _config });

      const addons = root.find(AddonsCard).prop('addons');
      expect(addons.length).toEqual(3);
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

    it('sends a beacon for the impression on mount', () => {
      const _navigator = { sendBeacon: sinon.spy() };
      const impressionData = 'some data';
      const impressionURL = 'https://mozilla.org/';
      _loadPromotedShelf({
        addons: [fakeAddon],
        impressionData,
        impressionURL,
      });

      render({ _config, _navigator });

      sinon.assert.calledWith(
        _navigator.sendBeacon,
        impressionURL,
        formatDataForBeacon({ data: impressionData, key: 'impression_data' }),
      );
    });

    it('sends a beacon for the impression on update', () => {
      const _navigator = { sendBeacon: sinon.spy() };
      const impressionData = 'some data';
      const impressionURL = 'https://mozilla.org/';

      const root = render({ _config, _navigator });

      root.setProps({
        shelfData: _createShelfData({
          impressionData,
          impressionURL,
        }),
      });

      sinon.assert.calledWith(
        _navigator.sendBeacon,
        impressionURL,
        formatDataForBeacon({ data: impressionData, key: 'impression_data' }),
      );
    });

    it('does not send a beacon for the impression when shelfData is not loaded', () => {
      const _navigator = { sendBeacon: sinon.spy() };
      const root = render({ _config, _navigator });

      root.setProps({ shelfData: null });
      sinon.assert.notCalled(_navigator.sendBeacon);
    });

    it('does not send a beacon for the impression when impression_data is missing', () => {
      const _navigator = { sendBeacon: sinon.spy() };

      const root = render({ _config, _navigator });

      root.setProps({
        shelfData: _createShelfData({
          impressionData: null,
        }),
      });

      sinon.assert.notCalled(_navigator.sendBeacon);
    });

    it('does not send a beacon for the impression when impression_url is missing', () => {
      const _navigator = { sendBeacon: sinon.spy() };

      const root = render({ _config, _navigator });

      root.setProps({
        shelfData: _createShelfData({
          impressionURL: null,
        }),
      });

      sinon.assert.notCalled(_navigator.sendBeacon);
    });
  });

  it('can pass a custom classname to AddonsCard', () => {
    const className = 'some-class-name';
    const root = render({ className });

    expect(root.find(AddonsCard)).toHaveClassName(className);
  });

  it('passes addonInstallSource to AddonsCard', () => {
    const addonInstallSource = 'featured-on-home-page';
    const addons = [createInternalAddon(fakeAddon)];
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
    onAddonClick(createInternalAddon(addon));

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
    onAddonImpression(createInternalAddon(addon));

    sinon.assert.calledWith(_tracking.sendEvent, {
      action: PROMOTED_ADDON_IMPRESSION_ACTION,
      category: PROMOTED_ADDON_HOMEPAGE_IMPRESSION_CATEGORY,
      label: guid,
    });
  });
});
