import { encode } from 'universal-base64url';
import * as React from 'react';

import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_CLICK_ACTION,
  GET_FIREFOX_BUTTON_CLICK_CATEGORY,
  GetFirefoxButtonBase,
  getDownloadCategory,
  getDownloadTerm,
} from 'amo/components/GetFirefoxButton';
import {
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FIREFOX_BASE_URL,
  DOWNLOAD_FIREFOX_UTM_TERM,
  LINE,
  RECOMMENDED,
  SPONSORED,
  SPOTLIGHT,
  STRATEGIC,
  VERIFIED,
} from 'amo/constants';
import {
  createFakeEvent,
  createFakeTracking,
  createInternalAddonWithLang,
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  fakeTheme,
  shallowUntilTarget,
  userAgents,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function render(props = {}) {
    const { store } = dispatchClientMetadata();

    return shallowUntilTarget(
      <GetFirefoxButton
        addon={createInternalAddonWithLang(fakeAddon)}
        i18n={fakeI18n()}
        store={store}
        {...props}
      />,
      GetFirefoxButtonBase,
    );
  }

  describe('On firefox', () => {
    it('renders nothing if the browser is Firefox Desktop', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefox[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(0);
    });

    it('renders nothing if the browser is Firefox for Android', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefoxAndroid[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(0);
    });

    it('renders nothing if the browser is Firefox for iOS', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefoxIOS[0],
      });
      const root = render({ store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(0);
    });
  });

  describe('Not firefox', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({
      clientApp,
      userAgent: userAgents.chrome[0],
    });

    it('renders a GetFirefoxButton if the browser is not Firefox', () => {
      const root = render({ store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(1);
    });

    it('accepts a custom className', () => {
      const className = 'some-class';
      const root = render({ className, store });

      expect(root.find('.GetFirefoxButton')).toHaveClassName(className);
    });

    it('calls _getPromotedCategory to determine if an add-on is recommended', () => {
      const _getPromotedCategory = sinon.spy();
      const addon = createInternalAddonWithLang(fakeAddon);
      render({ _getPromotedCategory, addon, store });

      sinon.assert.calledWith(_getPromotedCategory, {
        addon,
        clientApp,
        forBadging: true,
      });
    });

    // See: https://docs.google.com/document/d/1vXpEg_ypqr-eiXu6pWBDiyQWwf_rxYhHAGnsp3qwpCo/edit?usp=sharing
    it('passes the expected URL params on the download link', () => {
      const guid = 'some-guid';
      const addon = createInternalAddonWithLang({ ...fakeAddon, guid });
      const root = render({
        addon,
        store,
      });

      const queryString = [
        'utm_campaign=non-fx-button',
        `utm_content=rta%3A${encode(addon.guid)}`,
        'utm_medium=referral',
        'utm_source=addons.mozilla.org',
        `utm_term=amo-fx-cta-${addon.id}`,
      ].join('&');
      const expectedHref = `${DOWNLOAD_FIREFOX_BASE_URL}?${queryString}`;

      expect(root.find('.GetFirefoxButton-button')).toHaveProp(
        'href',
        expectedHref,
      );
    });

    it('calls universal-base64url.encode to encode the guid of the add-on', () => {
      const _encode = sinon.spy();
      const guid = 'some-guid';
      const addon = createInternalAddonWithLang({ ...fakeAddon, guid });
      render({
        _encode,
        addon,
        store,
      });

      sinon.assert.calledWith(_encode, addon.guid);
    });

    // See: https://github.com/mozilla/addons-frontend/issues/7255
    it('does not call universal-base64url.encode when add-on has a `null` GUID', () => {
      const _encode = sinon.spy();
      const addon = createInternalAddonWithLang({ ...fakeAddon, guid: null });

      render({
        _encode,
        addon,
        store,
      });

      sinon.assert.notCalled(_encode);
    });

    it.each([LINE, RECOMMENDED, SPONSORED, VERIFIED])(
      'has the expected button text for an RTAMO supported extension',
      (category) => {
        const root = render({
          addon: createInternalAddonWithLang({
            ...fakeAddon,
            promoted: { category, apps: [CLIENT_APP_FIREFOX] },
          }),
          store,
        });

        expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
          'Download Firefox and get the extension',
        );
      },
    );

    it.each([SPOTLIGHT, STRATEGIC])(
      'has the expected button text for an RTAMO unsupported extension',
      (category) => {
        const root = render({
          addon: createInternalAddonWithLang({
            ...fakeAddon,
            promoted: { category, apps: [CLIENT_APP_FIREFOX] },
          }),
          store,
        });

        expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
          'Download Firefox',
        );
      },
    );

    it.each([LINE, RECOMMENDED, SPONSORED, VERIFIED])(
      'has the expected button text for an RTAMO supported theme',
      (category) => {
        const root = render({
          addon: createInternalAddonWithLang({
            ...fakeTheme,
            promoted: { category, apps: [CLIENT_APP_FIREFOX] },
          }),
          store,
        });

        expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
          'Download Firefox and get the theme',
        );
      },
    );

    it.each([SPOTLIGHT, STRATEGIC])(
      'has the expected button text for an RTAMO supported theme',
      (category) => {
        const root = render({
          addon: createInternalAddonWithLang({
            ...fakeTheme,
            promoted: { category, apps: [CLIENT_APP_FIREFOX] },
          }),
          store,
        });

        expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
          'Download Firefox',
        );
      },
    );

    it('has the expected callout text for an extension', () => {
      const root = render({
        addon: createInternalAddonWithLang(fakeAddon),
        store,
      });

      expect(root.find('.GetFirefoxButton-callout-text').children()).toHaveText(
        `You'll need Firefox to use this extension`,
      );
    });

    it('has the expected callout text for a theme', () => {
      const root = render({
        addon: createInternalAddonWithLang(fakeTheme),
        store,
      });

      expect(root.find('.GetFirefoxButton-callout-text').children()).toHaveText(
        `You'll need Firefox to use this theme`,
      );
    });

    describe('tracking', () => {
      it('sends a tracking event when the button is clicked', () => {
        const _tracking = createFakeTracking();
        const guid = 'some-guid';
        const addon = createInternalAddonWithLang({ ...fakeAddon, guid });
        const root = render({
          _tracking,
          addon,
          store,
        });

        const event = createFakeEvent();
        root.find('.GetFirefoxButton-button').simulate('click', event);

        sinon.assert.calledWith(_tracking.sendEvent, {
          action: GET_FIREFOX_BUTTON_CLICK_ACTION,
          category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
          label: addon.guid,
        });
        sinon.assert.calledOnce(_tracking.sendEvent);
      });
    });
  });

  describe('getDownloadTerm', () => {
    it('returns a term without an addonId or variant', () => {
      expect(getDownloadTerm()).toEqual(DOWNLOAD_FIREFOX_UTM_TERM);
    });

    it('returns a term with an addonId', () => {
      const addonId = 12345;
      expect(getDownloadTerm({ addonId })).toEqual(
        `${DOWNLOAD_FIREFOX_UTM_TERM}-${addonId}`,
      );
    });

    it('returns a term with a variant', () => {
      const variant = 'some-variant';
      expect(getDownloadTerm({ variant })).toEqual(
        `${DOWNLOAD_FIREFOX_UTM_TERM}-${variant}`,
      );
    });

    it('returns a term with both an addonId and a variant', () => {
      const addonId = 12345;
      const variant = 'some-variant';
      expect(getDownloadTerm({ addonId, variant })).toEqual(
        `${DOWNLOAD_FIREFOX_UTM_TERM}-${addonId}-${variant}`,
      );
    });
  });

  describe('getDownloadCategory', () => {
    it('returns a category without a variant', () => {
      expect(getDownloadCategory()).toEqual(GET_FIREFOX_BUTTON_CLICK_CATEGORY);
    });

    it('returns a category with a variant', () => {
      const variant = 'some-variant';
      expect(getDownloadCategory(variant)).toEqual(
        `${GET_FIREFOX_BUTTON_CLICK_CATEGORY}-${variant}`,
      );
    });
  });
});
