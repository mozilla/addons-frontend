import React from 'react';
import {
  Simulate,
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import {
  LanguagePickerBase,
  changeLocaleURL,
} from 'amo/components/LanguagePicker';
import { fakeI18n } from 'tests/unit/helpers';


describe('LanguagePicker', () => {
  function renderLanguagePicker({ ...props }) {
    const initialState = { api: { clientApp: 'android', lang: 'fr' } };
    const { store } = createStore(initialState);

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <LanguagePickerBase i18n={fakeI18n()} {...props} />
      </Provider>
    ), LanguagePickerBase);
  }

  it('renders a LanguagePicker', () => {
    const root = renderLanguagePicker();

    expect(root.selector.tagName).toEqual('SELECT');
  });

  it('selects the current locale', () => {
    const root = renderLanguagePicker({ currentLocale: 'fr' });

    expect(findDOMNode(root).querySelector('option:checked').value).toEqual('fr');
  });

  it('changes the language on change', () => {
    const _window = { location: '/fr/firefox/' };
    const root = renderLanguagePicker({
      currentLocale: 'fr',
      location: { pathname: _window.location, query: {} },
      _window,
    });
    const fakeEvent = {
      preventDefault: sinon.stub(),
      target: { value: 'es' },
    };
    Simulate.change(root.selector, fakeEvent);

    expect(_window.location).toEqual('/es/firefox/');
  });
});

describe('changeLocaleURL', () => {
  it('changes the URL', () => {
    const newURL = changeLocaleURL({
      currentLocale: 'en-US',
      location: {
        pathname: '/en-US/firefox/nowhere/',
        query: { page: 1, q: 'search' },
      },
      newLocale: 'en-GB',
    });

    expect(newURL).toEqual('/en-GB/firefox/nowhere/?page=1&q=search');
  });

  it('handles URLs without query params', () => {
    const newURL = changeLocaleURL({
      currentLocale: 'en-US',
      location: { pathname: '/en-US/firefox/nowhere/', query: {} },
      newLocale: 'ar',
    });

    expect(newURL).toEqual('/ar/firefox/nowhere/');
  });

  it('only changes the locale section of the URL', () => {
    const newURL = changeLocaleURL({
      currentLocale: 'en-US',
      location: {
        pathname: '/en-US/firefox/en-US-to-en-GB-guide/',
        query: { foo: 'en-US' },
      },
      newLocale: 'ar',
    });

    expect(newURL).toEqual('/ar/firefox/en-US-to-en-GB-guide/?foo=en-US');
  });
});
