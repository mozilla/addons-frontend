import { encode } from 'universal-base64url';
import * as React from 'react';

import {
  VARIANT_CURRENT,
  VARIANT_NEW,
} from 'amo/experiments/20210404_download_cta_experiment';
import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
  GET_FIREFOX_BUTTON_TYPE_HEADER,
  GET_FIREFOX_BUTTON_TYPE_NONE,
  GET_FIREFOX_BUTTON_CLICK_ACTION,
  GET_FIREFOX_BUTTON_CLICK_CATEGORY,
  GetFirefoxButtonBase,
  getDownloadCampaign,
} from 'amo/components/GetFirefoxButton';
import {
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FIREFOX_BASE_URL,
  RECOMMENDED,
} from 'amo/constants';
import { makeQueryStringWithUTM } from 'amo/utils';
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
import Button from 'amo/components/Button';

describe(__filename, () => {
  function render(props = {}) {
    const { store } = dispatchClientMetadata();

    return shallowUntilTarget(
      <GetFirefoxButton
        buttonType={GET_FIREFOX_BUTTON_TYPE_HEADER}
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

    describe('addon type', () => {
      const buttonType = GET_FIREFOX_BUTTON_TYPE_ADDON;

      it('adds the expected class to the root for the new variant', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeAddon),
          buttonType,
          store,
          useNewVersion: true,
        });

        expect(root).toHaveClassName('GetFirefoxButton--new');
      });

      it('adds the expected class to the root for the current version', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeAddon),
          buttonType,
          store,
          useNewVersion: false,
        });

        expect(root).toHaveClassName('GetFirefoxButton--current');
      });

      it('calls _getPromotedCategory to determine if an add-on is recommended', () => {
        const _getPromotedCategory = sinon.spy();
        const addon = createInternalAddonWithLang(fakeAddon);
        render({ _getPromotedCategory, addon, buttonType, store });

        sinon.assert.calledWith(_getPromotedCategory, {
          addon,
          clientApp,
          forBadging: true,
        });
      });

      // See: https://docs.google.com/document/d/1vXpEg_ypqr-eiXu6pWBDiyQWwf_rxYhHAGnsp3qwpCo/edit?usp=sharing
      it('sets utm_campaign to non-fx-button for RTAMO (useNewVersion = false)', () => {
        const guid = 'some-guid';
        const addon = createInternalAddonWithLang({ ...fakeAddon, guid });
        const root = render({
          addon,
          buttonType,
          store,
          useNewVersion: false,
        });

        const utmContent = `rta:${encode(addon.guid)}`;
        const expectedHref = `${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM(
          { utm_campaign: 'non-fx-button', utm_content: utmContent },
        )}`;

        expect(root.find('.GetFirefoxButton-button')).toHaveProp(
          'href',
          expectedHref,
        );
      });

      it('sets utm_campaign to non-fx-button for RTAMO (useNewVersion = true)', () => {
        const guid = 'some-guid';
        const addon = createInternalAddonWithLang({ ...fakeAddon, guid });
        const root = render({
          addon,
          buttonType,
          store,
          useNewVersion: true,
        });

        const utmContent = `rta:${encode(addon.guid)}`;
        const expectedHref = `${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM(
          { utm_campaign: 'non-fx-button', utm_content: utmContent },
        )}`;

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
          buttonType,
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
          buttonType,
          store,
        });

        sinon.assert.notCalled(_encode);
      });

      it('sets the button as puffy and not micro', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeAddon),
          buttonType,
          store,
        });

        expect(root.find('.GetFirefoxButton')).toHaveProp('puffy', true);
        expect(root.find('.GetFirefoxButton')).toHaveProp('micro', false);
      });

      it.each([true, false])(
        'has the expected button text when useNewVersion is %s',
        (useNewVersion) => {
          const root = render({
            addon: createInternalAddonWithLang(fakeAddon),
            buttonType,
            store,
            useNewVersion,
          });

          const expectedText = useNewVersion
            ? 'Download Firefox'
            : 'Only with Firefox—Get Firefox Now';

          expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
            expectedText,
          );
        },
      );

      it('has the expected button text for an RTAMO supported extension', () => {
        const root = render({
          addon: createInternalAddonWithLang({
            ...fakeAddon,
            promoted: { category: RECOMMENDED, apps: [CLIENT_APP_FIREFOX] },
          }),
          buttonType,
          store,
          useNewVersion: true,
        });

        expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
          'Download Firefox and get the extension',
        );
      });

      it('has the expected button text for an RTAMO supported theme', () => {
        const root = render({
          addon: createInternalAddonWithLang({
            ...fakeTheme,
            promoted: { category: RECOMMENDED, apps: [CLIENT_APP_FIREFOX] },
          }),
          buttonType,
          store,
          useNewVersion: true,
        });

        expect(root.find('.GetFirefoxButton-button').children()).toHaveText(
          'Download Firefox and get the theme',
        );
      });

      it('has the expected callout text for an extension', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeAddon),
          buttonType,
          store,
          useNewVersion: true,
        });

        expect(
          root.find('.GetFirefoxButton-callout-text').children(),
        ).toHaveText(`You'll need Firefox to use this extension`);
      });

      it('has the expected callout text for a theme', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeTheme),
          buttonType,
          store,
          useNewVersion: true,
        });

        expect(
          root.find('.GetFirefoxButton-callout-text').children(),
        ).toHaveText(`You'll need Firefox to use this theme`);
      });

      it('does not display a callout for the current version', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeAddon),
          buttonType,
          store,
          useNewVersion: false,
        });

        expect(root.find('.GetFirefoxButton-callout')).toHaveLength(0);
      });
    });

    describe('header type', () => {
      const buttonType = GET_FIREFOX_BUTTON_TYPE_HEADER;

      it('renders nothing if showing the new variant', () => {
        const root = render({
          buttonType,
          store,
          useNewVersion: true,
        });

        expect(root.find('.GetFirefoxButton')).toHaveLength(0);
      });

      it('sets the href on the button with the expected utm params for the header for the current version', () => {
        const root = render({
          buttonType,
          store,
          useNewVersion: false,
        });

        const expectedHref = `${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM(
          {
            // The value below is hardcoded on purpose because a different
            // value would break RTAMO.
            utm_campaign: 'non-fx-button',
            utm_content: 'header-download-button',
          },
        )}`;
        expect(root.find(Button)).toHaveProp('href', expectedHref);
      });

      it('sets the button as micro and not puffy', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeAddon),
          buttonType,
          store,
        });

        expect(root.find('.GetFirefoxButton')).toHaveProp('puffy', false);
        expect(root.find('.GetFirefoxButton')).toHaveProp('micro', true);
      });

      it('has the expected button text', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeAddon),
          buttonType,
          store,
        });

        expect(root.children()).toHaveText('Download Firefox');
      });
    });

    describe('none type', () => {
      const buttonType = GET_FIREFOX_BUTTON_TYPE_NONE;

      it('renders nothing when the none type is specified', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeAddon),
          buttonType,
          store,
        });

        expect(root.find('.GetFirefoxButton')).toHaveLength(0);
      });
    });

    describe('tracking', () => {
      const guid = 'some-guid';
      const realAddon = createInternalAddonWithLang({ ...fakeAddon, guid });

      it.each([
        ['with addon', realAddon, false],
        ['without addon', undefined, false],
        ['with experiment', realAddon, true],
      ])(
        'sends a tracking event when the button is clicked %s',
        (desc, addon, useNewVersion) => {
          const _tracking = createFakeTracking();
          const root = render({
            _tracking,
            addon,
            buttonType: addon
              ? GET_FIREFOX_BUTTON_TYPE_ADDON
              : GET_FIREFOX_BUTTON_TYPE_HEADER,
            store,
            useNewVersion,
          });

          const event = createFakeEvent();
          root.find('.GetFirefoxButton-button').simulate('click', event);

          const category = `${GET_FIREFOX_BUTTON_CLICK_CATEGORY}-${
            useNewVersion ? VARIANT_NEW : VARIANT_CURRENT
          }`;
          sinon.assert.calledWith(_tracking.sendEvent, {
            action: GET_FIREFOX_BUTTON_CLICK_ACTION,
            category,
            label: addon ? addon.guid : '',
          });
          sinon.assert.calledOnce(_tracking.sendEvent);
        },
      );
    });
  });

  describe('getDownloadCampaign', () => {
    it('returns non-fx-button because anything else would break RTAMO', () => {
      expect(getDownloadCampaign()).toEqual('non-fx-button');
    });
  });
});
