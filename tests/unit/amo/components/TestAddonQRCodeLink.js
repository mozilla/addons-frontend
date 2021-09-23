import * as React from 'react';

import AddonQRCode from 'amo/components/AddonQRCode';
import AddonQRCodeLink, {
  AddonQRCodeLinkBase,
} from 'amo/components/AddonQRCodeLink';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  createFakeEvent,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const addonIdsWithQRCodes = [12345];
  const addonWithQRCode = createInternalAddonWithLang({
    ...fakeAddon,
    id: addonIdsWithQRCodes[0],
  });

  const render = ({
    _config = getFakeConfig(),
    addon = addonWithQRCode,
    // By default all tests will run with firefox as the clientApp.
    store = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
    }).store,
  } = {}) => {
    return shallowUntilTarget(
      <AddonQRCodeLink
        _config={_config}
        addon={addon}
        i18n={fakeI18n()}
        store={store}
      />,
      AddonQRCodeLinkBase,
    );
  };

  describe('flag enabled', () => {
    const _config = getFakeConfig({
      addonIdsWithQRCodes,
      enableFeatureAddonQRCode: true,
    });

    it('displays a link for a QR code on desktop, for an applicable add-on', () => {
      const root = render({ _config, addon: addonWithQRCode });

      expect(root.find('.AddonQRCodeLink')).toHaveLength(1);
    });

    it('does not display a link for a QR code on desktop, with no add-on', () => {
      const root = render({ _config, addon: null });

      expect(root.find('.AddonQRCodeLink')).toHaveLength(0);
    });

    it('does not display a link for a QR code on desktop, for an invalid add-on', () => {
      const root = render({
        _config,
        addon: createInternalAddonWithLang({
          ...fakeAddon,
          id: addonIdsWithQRCodes[0] + 1,
        }),
      });

      expect(root.find('.AddonQRCodeLink')).toHaveLength(0);
    });

    it('does not display a link for a QR code on mobile, for an applicable add-on', () => {
      const { store } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      });
      const root = render({ _config, addon: addonWithQRCode, store });

      expect(root.find('.AddonQRCodeLink')).toHaveLength(0);
    });

    it('displays a modal when user clicks the QRCode link', () => {
      const preventDefaultSpy = sinon.spy();
      const root = render({ _config, addon: addonWithQRCode });

      expect(root.find('.AddonQRCodeLink-modal')).toHaveLength(0);

      root
        .find('.AddonQRCodeLink-button')
        .simulate(
          'click',
          createFakeEvent({ preventDefault: preventDefaultSpy }),
        );

      sinon.assert.called(preventDefaultSpy);

      const modal = root.find('.AddonQRCodeLink-modal');

      expect(modal).toHaveLength(1);
      expect(modal).toHaveProp('id', 'AddonQRCodeLink-modal');

      expect(root.find(AddonQRCode)).toHaveLength(1);
      expect(root.find(AddonQRCode)).toHaveProp('addon', addonWithQRCode);
      expect(root.find(AddonQRCode)).toHaveProp(
        'onDismiss',
        root.instance().onHideQRCode,
      );
    });

    it('closes the modal when user clicks the dismiss button', () => {
      const preventDefaultSpy = sinon.spy();
      const root = render({ _config });

      expect(root.find('.AddonQRCodeLink-modal')).toHaveLength(0);

      root
        .find('.AddonQRCodeLink-button')
        .simulate(
          'click',
          createFakeEvent({ preventDefault: preventDefaultSpy }),
        );

      sinon.assert.called(preventDefaultSpy);

      expect(root.find('.AddonQRCodeLink-modal')).toHaveLength(1);

      // Simulate clicking on the dismiss button.
      root.instance().onHideQRCode();

      expect(root.find('.AddonQRCodeLink-modal')).toHaveLength(0);
    });
  });

  describe('flag disabled', () => {
    const _config = getFakeConfig({
      addonIdsWithQRCodes,
      enableFeatureAddonQRCode: false,
    });

    it('does not display a link for a QR code on desktop, for an applicable add-on', () => {
      const root = render({ _config, addon: addonWithQRCode });

      expect(root.find('.AddonQRCodeLink-button')).toHaveLength(0);
    });
  });
});
