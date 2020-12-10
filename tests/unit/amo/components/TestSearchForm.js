import * as React from 'react';
import { Helmet } from 'react-helmet';

import AutoSearchInput from 'amo/components/AutoSearchInput';
import SearchForm, { SearchFormBase } from 'amo/components/SearchForm';
import { CLIENT_APP_FIREFOX, CLIENT_APP_ANDROID } from 'core/constants';
import { convertFiltersToQueryParams } from 'core/searchUtils';
import {
  createContextWithFakeRouter,
  createFakeAutocompleteResult,
  createFakeHistory,
  createInternalSuggestionWithLang,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
  simulateComponentCallback,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let fakeHistory;

  beforeEach(() => {
    fakeHistory = createFakeHistory();
  });

  const getProps = (customProps = {}) => {
    return {
      i18n: fakeI18n(),
      pathname: '/search/',
      store: dispatchClientMetadata().store,
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(<SearchForm {...props} />, SearchFormBase, {
      shallowOptions: createContextWithFakeRouter({ history: fakeHistory }),
    });
  };

  const simulateAutoSearchCallback = (props = {}) => {
    return simulateComponentCallback({
      Component: AutoSearchInput,
      ...props,
    });
  };

  it('renders a form', () => {
    const root = render();

    expect(root.find('.SearchForm')).toHaveLength(1);
    expect(root.find('.SearchForm')).toHaveProp('role', 'search');
  });

  it('can render a custom className', () => {
    const className = 'MyClass';
    const root = render({ className });

    expect(root.find('form')).toHaveClassName(className);
  });

  it('generates a base search URL', () => {
    const { store } = dispatchClientMetadata({
      clientApp: CLIENT_APP_FIREFOX,
      lang: 'en-GB',
    });
    const root = render({ store, pathname: '/find-stuff/' });

    expect(root.instance().baseSearchURL()).toEqual(
      `/en-GB/${CLIENT_APP_FIREFOX}/find-stuff/`,
    );
  });

  it('sets the form action URL', () => {
    const root = render();

    expect(root.find('form')).toHaveProp(
      'action',
      root.instance().baseSearchURL(),
    );
  });

  it('changes the URL on search', () => {
    const root = render();

    const filters = { query: 'panda themes' };
    const onSearch = simulateAutoSearchCallback({
      root,
      propName: 'onSearch',
    });
    onSearch(filters);

    sinon.assert.calledWith(fakeHistory.push, {
      pathname: root.instance().baseSearchURL(),
      query: convertFiltersToQueryParams(filters),
    });
  });

  it('pushes a new route when a suggestion is selected', () => {
    const root = render();

    const url = '/url/to/extension/detail/page';
    const suggestion = createInternalSuggestionWithLang(
      createFakeAutocompleteResult({ url, name: 'uBlock Origin' }),
    );
    const onSuggestionSelected = simulateAutoSearchCallback({
      root,
      propName: 'onSuggestionSelected',
    });
    onSuggestionSelected(suggestion);

    sinon.assert.calledWith(fakeHistory.push, url);
  });

  it('parses the URL of a suggestion to push the pathname', () => {
    const root = render();

    const pathname = '/url/to/extension/detail/page';
    const suggestion = createInternalSuggestionWithLang(
      createFakeAutocompleteResult({
        url: `https://example.org${pathname}`,
        name: 'uBlock Origin',
      }),
    );
    const onSuggestionSelected = simulateAutoSearchCallback({
      root,
      propName: 'onSuggestionSelected',
    });
    onSuggestionSelected(suggestion);

    sinon.assert.calledWith(fakeHistory.push, pathname);
  });

  it('does not push anything if the URL is empty', () => {
    const root = render();

    const suggestion = createInternalSuggestionWithLang(
      createFakeAutocompleteResult({
        url: '',
        name: 'uBlock Origin',
      }),
    );
    const onSuggestionSelected = simulateAutoSearchCallback({
      root,
      propName: 'onSuggestionSelected',
    });
    onSuggestionSelected(suggestion);

    sinon.assert.notCalled(fakeHistory.push);
  });

  it('renders a Helmet component with an opensearch link', () => {
    const root = render();

    const helmet = root.find(Helmet);
    expect(helmet).toHaveLength(1);

    const link = helmet.find('link');
    expect(link).toHaveLength(1);
    expect(link).toHaveProp('rel', 'search');
    expect(link).toHaveProp('type', 'application/opensearchdescription+xml');
  });

  it('renders an opensearch link for Android', () => {
    const clientApp = CLIENT_APP_ANDROID;
    const lang = 'en-CA';

    const { store } = dispatchClientMetadata({ clientApp, lang });

    const root = render({ store });

    const link = root.find('link');
    expect(link).toHaveProp('href', `/${lang}/${clientApp}/opensearch.xml`);
    expect(link).toHaveProp('title', 'Firefox Add-ons for Android');
  });

  it('renders an opensearch link for Firefox', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'fr';

    const { store } = dispatchClientMetadata({ clientApp, lang });

    const root = render({ store });

    const link = root.find('link');
    expect(link).toHaveProp('href', `/${lang}/${clientApp}/opensearch.xml`);
    expect(link).toHaveProp('title', 'Firefox Add-ons');
  });
});
