import * as React from 'react';

import AddonQRCode, {
  ADDON_QRCODE_CAMPAIGN,
  ADDON_QRCODE_CATEGORY,
  ADDON_QRCODE_CLICK_ACTION,
  ADDON_QRCODE_IMPRESSION_ACTION,
  AddonQRCodeBase,
} from 'amo/components/AddonQRCode';
import {
  CLIENT_APP_ANDROID,
  DEFAULT_UTM_SOURCE,
  DEFAULT_UTM_MEDIUM,
} from 'amo/constants';
import {
  createFakeEvent,
  createLocalizedString,
  createFakeTracking,
  createInternalAddonWithLang,
  fakeAddon,
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const goodAddonId = 12345;
  const _config = getFakeConfig({ addonIdsWithQRCodes: [goodAddonId] });

  const createGoodAddon = (addon = fakeAddon) => {
    return createInternalAddonWithLang({ ...addon, id: goodAddonId });
  };

  const getProps = (customProps = {}) => {
    return {
      _config,
      _tracking: createFakeTracking(),
      addon: createGoodAddon(),
      i18n: fakeI18n(),
      onDismiss: sinon.spy(),
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);
    return shallowUntilTarget(<AddonQRCode {...props} />, AddonQRCodeBase);
  };

  it('throws an exception if a QR code is not found for the add-on', () => {
    const badAddonId = goodAddonId + 1;
    const addon = createInternalAddonWithLang({ ...fakeAddon, id: badAddonId });

    expect(() => {
      render({ addon });
    }).toThrowError(`Could not find a QR code for addonId: ${badAddonId}`);
  });

  it('renders a link with the expected destination', () => {
    const slug = 'some-slug';
    const addon = createGoodAddon({ ...fakeAddon, slug });
    const queryString = [
      `utm_source=${DEFAULT_UTM_SOURCE}`,
      `utm_medium=${DEFAULT_UTM_MEDIUM}`,
      `utm_campaign=${ADDON_QRCODE_CAMPAIGN}`,
      `utm_content=${addon.id}`,
    ].join('&');
    const destination = `/${CLIENT_APP_ANDROID}/addon/${slug}/?${queryString}`;

    const root = render({ addon });

    expect(root.find('.AddonQRCode-link')).toHaveProp('to', destination);
  });

  it('renders a label with the expected text', () => {
    const name = 'Some Add-On Name';
    const addon = createGoodAddon({
      ...fakeAddon,
      name: createLocalizedString(name),
    });
    const root = render({ addon });

    expect(root.find('.AddonQRCode-label').text()).toContain(
      `To get ${name} on Firefox for Android`,
    );
  });

  it('renders an img with the expected src and alt text', () => {
    const name = 'Some Add-On Name';
    const addon = createGoodAddon({
      ...fakeAddon,
      name: createLocalizedString(name),
    });
    const staticPath = '/some-static/path/';
    const root = render({
      _config: getFakeConfig({
        addonIdsWithQRCodes: [goodAddonId],
        staticPath,
      }),
      addon,
    });

    expect(root.find('.AddonQRCode-img')).toHaveProp(
      'alt',
      `Get ${name} for Android`,
    );
    expect(root.find('.AddonQRCode-img')).toHaveProp(
      'src',
      `${_config.get('staticPath')}${goodAddonId}.png?v=2`,
    );
  });

  const clickLink = (root) => {
    root.find('.AddonQRCode-link').simulate('click', createFakeEvent());
  };

  it('calls onDismiss with the dismiss button is clicked', () => {
    const onDismiss = sinon.spy();
    const root = render({ onDismiss });

    root.find('.AddonQRCode-dismisser-button').simulate('click');

    sinon.assert.called(onDismiss);
  });

  it('calls onDismiss with the link is clicked', () => {
    const onDismiss = sinon.spy();
    const root = render({ onDismiss });

    clickLink(root);

    sinon.assert.called(onDismiss);
  });

  describe('tracking', () => {
    it('sends a tracking event for the impression on mount', () => {
      const _tracking = createFakeTracking();
      render({ _tracking });

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: ADDON_QRCODE_IMPRESSION_ACTION,
        category: ADDON_QRCODE_CATEGORY,
        label: String(goodAddonId),
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
    });

    it('sends a tracking event when the link is clicked', () => {
      const _tracking = createFakeTracking();
      const root = render({ _tracking });

      _tracking.sendEvent.resetHistory();
      clickLink(root);

      sinon.assert.calledWith(_tracking.sendEvent, {
        action: ADDON_QRCODE_CLICK_ACTION,
        category: ADDON_QRCODE_CATEGORY,
        label: String(goodAddonId),
      });
      sinon.assert.calledOnce(_tracking.sendEvent);
    });
  });
});
