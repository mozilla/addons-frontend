import * as React from 'react';

import Footer, { FooterBase } from 'amo/components/Footer';
import { makeQueryStringWithUTM } from 'amo/utils';
import {
  fakeI18n,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  function renderFooter({ ...props }) {
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
      'https://developer.mozilla.org/Add-ons/AMO/Policy/Contact',
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
  });
});
