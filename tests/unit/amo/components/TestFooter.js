import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import Footer from 'amo/components/Footer';
import I18nProvider from 'core/i18n/Provider';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { fakeI18n } from 'tests/unit/helpers';


describe('Footer', () => {
  function renderFooter({ ...props }) {
    const { store } = dispatchSignInActions();

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={fakeI18n()}>
          <Footer {...props} />
        </I18nProvider>
      </Provider>
    ), Footer));
  }

  it('renders a footer', () => {
    const root = renderFooter();

    // None of these links are localised because an unsupported locale will
    // cause a 404 error.
    // See:
    // github.com/mozilla/addons-frontend/pull/2524#pullrequestreview-42911624
    expect(root.querySelector('.Footer-privacy-link').textContent).toEqual('Privacy');
    expect(root.querySelector('.Footer-privacy-link').href).toEqual('https://www.mozilla.org/privacy/websites/');
    expect(root.querySelector('.Footer-legal-link').textContent).toEqual('Legal');
    expect(root.querySelector('.Footer-legal-link').href).toEqual('https://www.mozilla.org/about/legal/');
    expect(root.querySelector('.Footer-cookies-link').textContent).toEqual('Cookies');
    expect(root.querySelector('.Footer-cookies-link').href).toEqual('https://www.mozilla.org/privacy/websites/#cookies');
    expect(root.querySelector('.Footer-trademark-abuse-link').textContent).toEqual('Report Trademark Abuse');
    expect(root.querySelector('.Footer-trademark-abuse-link').href).toEqual('https://www.mozilla.org/about/legal/fraud-report/');


    // This link isn't localized because MDN will 404 on some
    // locales and not others.
    // See also https://bugzilla.mozilla.org/show_bug.cgi?id=1283422
    expect(root.querySelector('.Footer-bug-report-link').href).toEqual('https://developer.mozilla.org/Add-ons/AMO/Policy/Contact');
  });
});
