import * as React from 'react';

import Footer, { FooterBase } from 'amo/components/Footer';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


describe('Footer', () => {
  function renderFooter({ ...props }) {
    return shallowUntilTarget(
      <Footer i18n={fakeI18n()} {...props} />,
      FooterBase
    );
  }

  it('renders a footer', () => {
    const root = renderFooter();

    // None of these links are localised because an unsupported locale will
    // cause a 404 error.
    // See:
    // github.com/mozilla/addons-frontend/pull/2524#pullrequestreview-42911624
    expect(root.find('.Footer-privacy-link')).toHaveText('Privacy');
    expect(root.find('.Footer-privacy-link')).toHaveProp('href', 'https://www.mozilla.org/privacy/websites/');
    expect(root.find('.Footer-legal-link')).toHaveText('Legal');
    expect(root.find('.Footer-legal-link')).toHaveProp('href', 'https://www.mozilla.org/about/legal/');
    expect(root.find('.Footer-cookies-link')).toHaveText('Cookies');
    expect(root.find('.Footer-cookies-link')).toHaveProp('href', 'https://www.mozilla.org/privacy/websites/#cookies');
    expect(root.find('.Footer-trademark-abuse-link')).toHaveText('Report Trademark Abuse');
    expect(root.find('.Footer-trademark-abuse-link')).toHaveProp('href', 'https://www.mozilla.org/about/legal/fraud-report/');

    // This link isn't localized because MDN will 404 on some
    // locales and not others.
    // See also https://bugzilla.mozilla.org/show_bug.cgi?id=1283422
    expect(root.find('.Footer-bug-report-link')).toHaveProp('href', 'https://developer.mozilla.org/Add-ons/AMO/Policy/Contact');
  });
});
