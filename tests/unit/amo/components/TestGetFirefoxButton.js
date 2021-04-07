import { encode } from 'universal-base64url';
import * as React from 'react';

import GetFirefoxButton, {
  GET_FIREFOX_BUTTON_TYPE_ADDON,
  GET_FIREFOX_BUTTON_TYPE_HEADER,
  GET_FIREFOX_BUTTON_TYPE_NONE,
  GET_FIREFOX_BUTTON_CLICK_ACTION,
  GET_FIREFOX_BUTTON_CLICK_CATEGORY,
  VARIANT_CURRENT,
  VARIANT_NEW,
  GetFirefoxButtonBase,
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
    const variantsToTest = [VARIANT_CURRENT, VARIANT_NEW, null];

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
          variant: VARIANT_NEW,
        });

        expect(root).toHaveClassName('GetFirefoxButton--new');
      });

      it.each([VARIANT_CURRENT, null])(
        'adds the expected class to the root for the %s variant',
        (variant) => {
          const root = render({
            addon: createInternalAddonWithLang(fakeAddon),
            buttonType,
            store,
            variant,
          });

          expect(root).toHaveClassName('GetFirefoxButton--current');
        },
      );

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

      it.each(variantsToTest)(
        'sets the href on the button with the expected utm params for the add-on for %s',
        (variant) => {
          const guid = 'some-guid';
          const addon = createInternalAddonWithLang({ ...fakeAddon, guid });
          const root = render({
            addon,
            buttonType,
            store,
            variant,
          });

          const utmCampaign = variant
            ? `amo-fx-cta-${addon.id}-${variant}`
            : `amo-fx-cta-${addon.id}`;
          const utmContent = `rta:${encode(addon.guid)}`;

          const expectedHref = `${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM(
            { utm_campaign: utmCampaign, utm_content: utmContent },
          )}`;

          expect(root.find('.GetFirefoxButton-button')).toHaveProp(
            'href',
            expectedHref,
          );
        },
      );

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

      it.each(variantsToTest)(
        'has the expected button text for %s',
        (variant) => {
          const root = render({
            addon: createInternalAddonWithLang(fakeAddon),
            buttonType,
            store,
            variant,
          });

          const expectedText = [VARIANT_CURRENT, null].includes(variant)
            ? 'Only with Firefox—Get Firefox Now'
            : 'Download Firefox';

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
          variant: VARIANT_NEW,
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
          variant: VARIANT_NEW,
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
          variant: VARIANT_NEW,
        });

        expect(root.find('.GetFirefoxButton-callout').children()).toHaveText(
          `You'll need Firefox to use this extension`,
        );
      });

      it('has the expected callout text for a theme', () => {
        const root = render({
          addon: createInternalAddonWithLang(fakeTheme),
          buttonType,
          store,
          variant: VARIANT_NEW,
        });

        expect(root.find('.GetFirefoxButton-callout').children()).toHaveText(
          `You'll need Firefox to use this theme`,
        );
      });

      it.each([VARIANT_CURRENT, null])(
        'does not display a callout for %s',
        (variant) => {
          const root = render({
            addon: createInternalAddonWithLang(fakeAddon),
            buttonType,
            store,
            variant,
          });

          expect(root.find('.GetFirefoxButton-callout')).toHaveLength(0);
        },
      );
    });

    describe('header type', () => {
      const buttonType = GET_FIREFOX_BUTTON_TYPE_HEADER;

      it('renders nothing if showing the new variant', () => {
        const root = render({
          buttonType,
          store,
          variant: VARIANT_NEW,
        });

        expect(root.find('.GetFirefoxButton')).toHaveLength(0);
      });

      it.each([VARIANT_CURRENT, null])(
        'sets the href on the button with the expected utm params for the header for %s',
        (variant) => {
          const root = render({
            buttonType,
            store,
            variant,
          });

          const utmCampaign = variant ? `amo-fx-cta-${variant}` : 'amo-fx-cta';
          const expectedHref = `${DOWNLOAD_FIREFOX_BASE_URL}${makeQueryStringWithUTM(
            {
              utm_campaign: utmCampaign,
              utm_content: 'header-download-button',
            },
          )}`;
          expect(root.find(Button)).toHaveProp('href', expectedHref);
        },
      );

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
        ['with addon', realAddon, null],
        ['without addon', undefined, null],
        ['with experiment', realAddon, VARIANT_NEW],
      ])(
        'sends a tracking event when the button is clicked %s',
        (desc, addon, variant) => {
          const _tracking = createFakeTracking();
          const root = render({
            _tracking,
            addon,
            buttonType: addon
              ? GET_FIREFOX_BUTTON_TYPE_ADDON
              : GET_FIREFOX_BUTTON_TYPE_HEADER,
            store,
            variant,
          });

          const event = createFakeEvent();
          root.find('.GetFirefoxButton-button').simulate('click', event);

          const category = variant
            ? `${GET_FIREFOX_BUTTON_CLICK_CATEGORY}-${variant}`
            : GET_FIREFOX_BUTTON_CLICK_CATEGORY;

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
});
