import { encode } from 'universal-base64url';
import * as React from 'react';

import {
  EXPERIMENT_CONFIG,
  VARIANT_CURRENT,
  VARIANT_NEW,
} from 'amo/experiments/20210531_amo_download_funnel_experiment';
import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_CLICK_ACTION,
  GET_FIREFOX_BUTTON_CLICK_CATEGORY,
  GetFirefoxButtonBase,
  getDownloadLink,
  getDownloadCampaign,
} from 'amo/components/GetFirefoxButton';
import {
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FIREFOX_BASE_URL,
  DOWNLOAD_FIREFOX_EXPERIMENTAL_URL,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
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

    it('renders a GetFirefoxButton if forIncompatibleAddon is true', () => {
      const { store } = dispatchClientMetadata({
        userAgent: userAgents.firefox[0],
      });
      const root = render({ forIncompatibleAddon: true, store });

      expect(root.find('.GetFirefoxButton')).toHaveLength(1);
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

    it.each([LINE, RECOMMENDED, SPONSORED, VERIFIED])(
      'has the expected button text for an RTAMO supported extension, which is incompatible',
      (category) => {
        const root = render({
          addon: createInternalAddonWithLang({
            ...fakeAddon,
            promoted: { category, apps: [CLIENT_APP_FIREFOX] },
          }),
          forIncompatibleAddon: true,
          store,
        });

        expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
          'Download the new Firefox and get the extension',
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

    it.each([LINE, RECOMMENDED, SPONSORED, VERIFIED])(
      'has the expected button text for an RTAMO supported theme, which is incompatible',
      (category) => {
        const root = render({
          addon: createInternalAddonWithLang({
            ...fakeTheme,
            promoted: { category, apps: [CLIENT_APP_FIREFOX] },
          }),
          forIncompatibleAddon: true,
          store,
        });

        expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
          'Download the new Firefox and get the theme',
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

    it('has the expected callout text for an extension, which is incompatible', () => {
      const root = render({
        addon: createInternalAddonWithLang(fakeAddon),
        forIncompatibleAddon: true,
        store,
      });

      expect(root.find('.GetFirefoxButton-callout-text').children()).toHaveText(
        'You need an updated version of Firefox for this extension',
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

    it('has the expected callout text for a theme, which is incompatible', () => {
      const root = render({
        addon: createInternalAddonWithLang(fakeTheme),
        forIncompatibleAddon: true,
        store,
      });

      expect(root.find('.GetFirefoxButton-callout-text').children()).toHaveText(
        'You need an updated version of Firefox for this theme',
      );
    });

    describe('tracking', () => {
      const guid = 'some-guid';
      const addon = createInternalAddonWithLang({ ...fakeAddon, guid });

      it.each([undefined, VARIANT_NEW, VARIANT_CURRENT])(
        'sends a tracking event when the button is clicked and variant is %s',
        (variant) => {
          const _tracking = createFakeTracking();
          const root = render({
            _tracking,
            addon,
            store,
            variant,
          });

          const event = createFakeEvent();
          root.find('.GetFirefoxButton-button').simulate('click', event);

          sinon.assert.calledWith(_tracking.sendEvent, {
            action: GET_FIREFOX_BUTTON_CLICK_ACTION,
            category: GET_FIREFOX_BUTTON_CLICK_CATEGORY,
            label: addon.guid,
            sendSecondEventWithOverrides: variant && {
              category: `${GET_FIREFOX_BUTTON_CLICK_CATEGORY}-${variant}`,
            },
          });
          sinon.assert.calledOnce(_tracking.sendEvent);
        },
      );
    });
  });

  describe('getDownloadCampaign', () => {
    it('returns a campaign without an addonId', () => {
      expect(getDownloadCampaign()).toEqual(DOWNLOAD_FIREFOX_UTM_CAMPAIGN);
    });

    it('returns a campaign with an addonId', () => {
      const addonId = 12345;
      expect(getDownloadCampaign({ addonId })).toEqual(
        `${DOWNLOAD_FIREFOX_UTM_CAMPAIGN}-${addonId}`,
      );
    });
  });

  describe('getDownloadLink', () => {
    const guid = 'some-guid';

    it.each([VARIANT_CURRENT, VARIANT_NEW, null])(
      'returns the expected base URL for the %s variant',
      (variant) => {
        const link = getDownloadLink({ variant });
        const linkRegex = new RegExp(
          `^${
            variant === VARIANT_NEW
              ? DOWNLOAD_FIREFOX_EXPERIMENTAL_URL
              : DOWNLOAD_FIREFOX_BASE_URL
          }`,
        );
        expect(linkRegex.test(link)).toEqual(true);
      },
    );

    it.each([VARIANT_CURRENT, VARIANT_NEW, null])(
      'adds or excludes the special xv param for the %s variant',
      (variant) => {
        const link = getDownloadLink({ variant });
        expect(/xv=amo&/.test(link)).toEqual(variant === VARIANT_NEW);
      },
    );

    it('includes and overrides params via overrideQueryParams', () => {
      const param1 = 'test';
      const utm_campaign = 'overridden_utm_campaign';
      const link = getDownloadLink({
        overrideQueryParams: { param1, utm_campaign },
      });
      expect(link.includes(`param1=${param1}`)).toEqual(true);
      expect(link.includes(`utm_campaign=${utm_campaign}`)).toEqual(true);
    });

    it('calls universal-base64url.encode to encode the guid of the add-on for utm_content', () => {
      const encodedGuid = encode(guid);
      const _encode = sinon.stub().returns(encodedGuid);
      const addon = createInternalAddonWithLang({ ...fakeAddon, guid });

      const link = getDownloadLink({ _encode, addon });

      sinon.assert.calledWith(_encode, addon.guid);
      expect(link.includes(`utm_content=rta%3A${encodedGuid}`)).toEqual(true);
    });

    // See: https://github.com/mozilla/addons-frontend/issues/7255
    it('does not call universal-base64url.encode when add-on has a `null` GUID', () => {
      const _encode = sinon.spy();
      const addon = createInternalAddonWithLang({ ...fakeAddon, guid: null });

      const link = getDownloadLink({ _encode, addon });

      sinon.assert.notCalled(_encode);
      expect(link.includes('utm_content')).toEqual(false);
    });

    it('calls getDownloadCampaign with an add-on to populate utm_campaign', () => {
      const addonId = 123;
      const addon = createInternalAddonWithLang({ ...fakeAddon, id: addonId });
      const campaign = 'some_campaign';
      const _getDownloadCampaign = sinon.stub().returns(campaign);

      const link = getDownloadLink({ _getDownloadCampaign, addon });

      sinon.assert.calledWith(_getDownloadCampaign, { addonId });
      expect(link.includes(`utm_campaign=${campaign}`)).toEqual(true);
    });

    it('calls getDownloadCampaign without an add-on to populate utm_campaign', () => {
      const addon = undefined;
      const campaign = 'some_campaign';
      const _getDownloadCampaign = sinon.stub().returns(campaign);

      const link = getDownloadLink({ _getDownloadCampaign, addon });

      sinon.assert.calledWith(_getDownloadCampaign, { addonId: undefined });
      expect(link.includes(`utm_campaign=${campaign}`)).toEqual(true);
    });

    // Note: This is a sanity test for the entire URL string. Each of the
    // individual tests above test separate pieces of logic.
    it('returns the expected URL for an add-on', () => {
      const addonId = 123;
      const addon = createInternalAddonWithLang({ ...fakeAddon, id: addonId });

      const expectedLink = [
        `${DOWNLOAD_FIREFOX_EXPERIMENTAL_URL}?experiment=${EXPERIMENT_CONFIG.id}`,
        `variation=${VARIANT_NEW}`,
        `xv=amo`,
        `utm_campaign=${DOWNLOAD_FIREFOX_UTM_CAMPAIGN}-${addonId}`,
        `utm_content=rta%3A${encode(addon.guid)}`,
        `utm_medium=referral&utm_source=addons.mozilla.org`,
      ].join('&');

      expect(
        getDownloadLink({
          addon,
          overrideQueryParams: {
            experiment: EXPERIMENT_CONFIG.id,
            variation: VARIANT_NEW,
          },
          variant: VARIANT_NEW,
        }),
      ).toEqual(expectedLink);
    });
  });
});
