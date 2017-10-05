import { mount } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';

import I18nProvider from 'core/i18n/Provider';
import Footer from 'amo/components/Footer';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('Footer', () => {
  function renderFooter({ ...props }) {
    const store = dispatchClientMetadata().store;

    return mount(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <Footer {...props} />
        </I18nProvider>
      </Provider>
    );
  }

  it('renders a footer', () => {
    const root = renderFooter();

    // None of these links are localised because an unsupported locale will
    // cause a 404 error.
    // See:
    // github.com/mozilla/addons-frontend/pull/2524#pullrequestreview-42911624
    expect(root.find('.Footer-privacy-link').text()).toEqual('Privacy');
    expect(root.find('.Footer-privacy-link').prop('href')).toEqual('https://www.mozilla.org/privacy/websites/');
    expect(root.find('.Footer-legal-link').text()).toEqual('Legal');
    expect(root.find('.Footer-legal-link').prop('href')).toEqual('https://www.mozilla.org/about/legal/');
    expect(root.find('.Footer-cookies-link').text()).toEqual('Cookies');
    expect(root.find('.Footer-cookies-link').prop('href')).toEqual('https://www.mozilla.org/privacy/websites/#cookies');
    expect(root.find('.Footer-trademark-abuse-link').text()).toEqual('Report Trademark Abuse');
    expect(root.find('.Footer-trademark-abuse-link').prop('href')).toEqual('https://www.mozilla.org/about/legal/fraud-report/');
    expect(root.find('.Footer-amo-links li').length).toEqual(6);

    // This link isn't localized because MDN will 404 on some
    // locales and not others.
    // See also https://bugzilla.mozilla.org/show_bug.cgi?id=1283422
    expect(root.find('.Footer-bug-report-link').prop('href')).toEqual('https://developer.mozilla.org/Add-ons/AMO/Policy/Contact');
  });
});
