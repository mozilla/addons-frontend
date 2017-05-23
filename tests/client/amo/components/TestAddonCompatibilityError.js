import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import createStore from 'amo/store';
import {
  INCOMPATIBLE_FIREFOX_FOR_IOS,
  INCOMPATIBLE_NO_OPENSEARCH,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_UNDER_MIN_VERSION,
} from 'core/constants';
import { signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';


describe('AddonCompatibilityError', () => {
  const defaultUserAgentInfo = {
    browser: { name: 'Firefox' },
    os: { name: 'Plan 9' },
  };

  function render({ ...props }) {
    const api = {
      ...signedInApiState,
      lang: props.lang,
      userAgentInfo: props.userAgentInfo,
    };
    const { store } = createStore({ api });

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <AddonCompatibilityError minVersion={null} {...props} />
        </I18nProvider>
      </Provider>
    ), AddonCompatibilityError);
  }

  it('renders a notice for non-Firefox browsers', () => {
    const root = render({
      lang: 'es',
      reason: INCOMPATIBLE_NOT_FIREFOX,
      userAgentInfo: { browser: { name: 'Chrome' }, os: {} } });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('a').href).toEqual('https://www.mozilla.org/es/firefox/');
    expect(rootNode.textContent).toContain('You need to download Firefox to install this add-on.');
  });

  it('renders a notice for old versions of Firefox', () => {
    const root = render({
      lang: 'fr',
      minVersion: '11.0',
      reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      userAgentInfo: { browser: { name: 'Firefox', version: '8.0' }, os: {} },
    });
    const rootNode = findDOMNode(root);

    expect(rootNode.querySelector('a').href).toEqual('https://www.mozilla.org/fr/firefox/');
    expect(rootNode.textContent).toContain('This add-on requires a newer version of Firefox');
    expect(rootNode.textContent).toContain('(at least version 11.0)');
    expect(rootNode.textContent).toContain('You are using Firefox 8.0.');
  });

  it('renders a notice for iOS users', () => {
    const root = render({
      reason: INCOMPATIBLE_FIREFOX_FOR_IOS,
      userAgentInfo: { browser: { name: 'Firefox' }, os: { name: 'iOS' } },
    });
    const rootNode = findDOMNode(root);

    expect(rootNode.textContent).toContain('Firefox for iOS does not currently support add-ons.');
  });

  it('renders a notice for browsers that do not support OpenSearch', () => {
    const root = render({
      reason: INCOMPATIBLE_NO_OPENSEARCH,
      userAgentInfo: { browser: { name: 'Firefox' }, os: { name: 'Plan 9' } },
    });
    const rootNode = findDOMNode(root);

    expect(rootNode.textContent).toContain('Your version of Firefox does not support search plugins.');
  });

  it('renders a notice and logs a warning when reason code not known', () => {
    const fakeLog = { warn: sinon.stub() };
    const root = render({
      log: fakeLog,
      reason: 'fake reason',
      userAgentInfo: defaultUserAgentInfo,
    });
    const rootNode = findDOMNode(root);

    expect(fakeLog.warn.called).toBe(true);
    expect(rootNode.textContent).toContain('Your browser does not support add-ons.');
  });

  it('throws an error if no reason is supplied', () => {
    expect(() => {
      render({ userAgentInfo: defaultUserAgentInfo });
    }).toThrow();
  });

  it('throws an error if minVersion is missing', () => {
    expect(() => {
      render({
        minVersion: undefined,
        reason: INCOMPATIBLE_NOT_FIREFOX,
        userAgentInfo: defaultUserAgentInfo,
      });
    }).toThrow();
  });
});
