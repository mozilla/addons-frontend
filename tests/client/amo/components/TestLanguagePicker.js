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
import { getFakeI18nInst } from 'tests/client/helpers';


describe('LanguagePicker', () => {
  function renderLanguagePicker({ ...props }) {
    const initialState = { api: { clientApp: 'android', lang: 'fr' } };

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <LanguagePickerBase i18n={getFakeI18nInst()} {...props} />
      </Provider>
    ), LanguagePickerBase);
  }

  it('renders a LanguagePicker', () => {
    const root = renderLanguagePicker();

    assert.equal(root.selector.tagName, 'SELECT');
  });

  it('selects the current locale', () => {
    const root = renderLanguagePicker({ currentLocale: 'fr' });

    assert.equal(findDOMNode(root).querySelector('option:checked').value, 'fr');
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

    assert.equal(_window.location, '/es/firefox/');
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

    assert.equal(newURL, '/en-GB/firefox/nowhere/?page=1&q=search');
  });

  it('handles URLs without query params', () => {
    const newURL = changeLocaleURL({
      currentLocale: 'en-US',
      location: { pathname: '/en-US/firefox/nowhere/', query: {} },
      newLocale: 'ar',
    });

    assert.equal(newURL, '/ar/firefox/nowhere/');
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

    assert.equal(newURL, '/ar/firefox/en-US-to-en-GB-guide/?foo=en-US');
  });
});
