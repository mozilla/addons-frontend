import * as React from 'react';

import Footer, { FooterBase } from 'amo/components/Footer';
import LanguagePicker from 'amo/components/LanguagePicker';
import { makeQueryStringWithUTM } from 'amo/utils';
import {
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function renderFooter({ ...props } = {}) {
    return shallowUntilTarget(
      <Footer i18n={fakeI18n()} {...props} />,
      FooterBase,
    );
  }

  it('renders a footer', () => {
    const extensionWorkshopUrl = 'http://extensionworkshop.fr';
    const _config = getFakeConfig({ extensionWorkshopUrl });

    const root = renderFooter({ _config });

    // None of these links are localised because an unsupported locale will
    // cause a 404 error.
    // See:
    // github.com/mozilla/addons-frontend/pull/2524#pullrequestreview-42911624
    expect(root.find('.Footer-privacy-link')).toHaveText('Privacy');
    expect(root.find('.Footer-privacy-link')).toHaveProp(
      'href',
      'https://www.mozilla.org/privacy/websites/',
    );
    expect(root.find('.Footer-cookies-link')).toHaveText('Cookies');
    expect(root.find('.Footer-cookies-link')).toHaveProp(
      'href',
      'https://www.mozilla.org/privacy/websites/',
    );
    expect(root.find('.Footer-legal-link')).toHaveText('Legal');
    expect(root.find('.Footer-legal-link')).toHaveProp(
      'href',
      'https://www.mozilla.org/about/legal/terms/mozilla/',
    );

    // This link isn't localized because MDN will 404 on some
    // locales and not others.
    // See also https://bugzilla.mozilla.org/show_bug.cgi?id=1283422
    expect(root.find('.Footer-bug-report-link')).toHaveProp(
      'href',
      'https://developer.mozilla.org/docs/Mozilla/Add-ons/Contact_us',
    );

    expect(root.find('.Footer-extension-workshop-link')).toHaveText(
      'Extension Workshop',
    );
    expect(root.find('.Footer-extension-workshop-link')).toHaveProp(
      'href',
      `${extensionWorkshopUrl}/${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-lockwise-link')).toHaveText('Lockwise');
    expect(root.find('.Footer-lockwise-link')).toHaveProp(
      'href',
      `https://www.mozilla.org/firefox/lockwise/${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-monitor-link')).toHaveText('Monitor');
    expect(root.find('.Footer-monitor-link')).toHaveProp(
      'href',
      `https://monitor.firefox.com/${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-browsers-link')).toHaveText('Browsers');
    expect(root.find('.Footer-browsers-link')).toHaveProp(
      'href',
      `https://www.mozilla.org/firefox/browsers/${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-pocket-link')).toHaveText('Pocket');
    expect(root.find('.Footer-pocket-link')).toHaveProp(
      'href',
      `https://getpocket.com${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-desktop-link')).toHaveText('Desktop');
    expect(root.find('.Footer-desktop-link')).toHaveProp(
      'href',
      `https://www.mozilla.org/firefox/new/${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-mobile-link')).toHaveText('Mobile');
    expect(root.find('.Footer-mobile-link')).toHaveProp(
      'href',
      `https://www.mozilla.org/firefox/mobile/${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-reality-link')).toHaveText('Reality');
    expect(root.find('.Footer-reality-link')).toHaveProp(
      'href',
      `https://mixedreality.mozilla.org/${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-enterprise-link')).toHaveText('Enterprise');
    expect(root.find('.Footer-enterprise-link')).toHaveProp(
      'href',
      `https://www.mozilla.org/firefox/enterprise/${makeQueryStringWithUTM({
        utm_content: 'footer-link',
        utm_campaign: null,
      })}`,
    );

    expect(root.find('.Footer-developer-policies-link')).toHaveText(
      'Developer Policies',
    );
    expect(root.find('.Footer-developer-policies-link')).toHaveProp(
      'href',
      `${extensionWorkshopUrl}/documentation/publish/add-on-policies/${makeQueryStringWithUTM(
        {
          utm_medium: 'photon-footer',
          utm_campaign: null,
        },
      )}`,
    );
  });

  it('renders with a LanguagePicker by default', () => {
    const root = renderFooter();

    expect(root.find(LanguagePicker)).toHaveLength(1);
  });

  it('can render without a LanguagePicker', () => {
    const root = renderFooter({ noLangPicker: true });

    expect(root.find(LanguagePicker)).toHaveLength(0);
  });
});
