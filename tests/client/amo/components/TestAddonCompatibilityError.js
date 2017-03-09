import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import createStore from 'amo/store';
import { signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';


describe('AddonCompatibilityError', () => {
  function render({ ...props }) {
    const api = { ...signedInApiState, userAgentInfo: props.userAgentInfo };

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore({ api })}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <AddonCompatibilityError {...props} />
        </I18nProvider>
      </Provider>
    ), AddonCompatibilityError);
  }

  it('logs a warning and renders nothing if compatible', () => {
    const fakeLog = { warn: sinon.stub() };
    const userAgentInfo = {
      browser: { name: 'Firefox' },
      os: { name: 'Plan 9' },
    };
    const root = render({ log: fakeLog, userAgentInfo });
    const rootNode = findDOMNode(root);

    assert.include(rootNode.textContent, '');
    assert.include(fakeLog.warn.firstCall.args[0],
      'no reason to mark the add-on as incompatible');
    assert.deepEqual(fakeLog.warn.firstCall.args[1], userAgentInfo);
  });

  it('renders a notice for non-Firefox browsers', () => {
    const root = render({
      userAgentInfo: { browser: { name: 'Chrome' }, os: {} } });
    const rootNode = findDOMNode(root);

    // This is localised to the current locale, which is en-US in our
    // signedInApiState helper.
    assert.equal(rootNode.querySelector('a').href,
      'https://www.mozilla.org/en-US/firefox/');
    assert.include(rootNode.textContent,
      'You need to download Firefox to install this add-on.');
  });

  it('renders a notice for old versions of Firefox', () => {
    const root = render({
      minVersion: '11.0',
      userAgentInfo: { browser: { name: 'Firefox', version: '8.0' }, os: {} },
    });
    const rootNode = findDOMNode(root);

    // This is localised to the current locale, which is en-US in our
    // signedInApiState helper.
    assert.equal(rootNode.querySelector('a').href,
      'https://www.mozilla.org/en-US/firefox/');
    assert.include(rootNode.textContent,
      'This add-on requires a newer version of Firefox');
    assert.include(rootNode.textContent, '(at least version 11.0)');
    assert.include(rootNode.textContent, 'You are using Firefox 8.0.');
  });

  it('renders a notice for new versions of Firefox', () => {
    const root = render({
      maxVersion: '9.4',
      userAgentInfo: { browser: { name: 'Firefox', version: '11.0' }, os: {} },
    });
    const rootNode = findDOMNode(root);

    assert.include(rootNode.textContent, 'up to version 9.4');
    assert.include(rootNode.textContent, 'You are using Firefox 11.0');
  });

  it('renders a notice for iOS users', () => {
    const root = render({
      userAgentInfo: { browser: { name: 'Firefox' }, os: { name: 'iOS' } },
    });
    const rootNode = findDOMNode(root);

    assert.include(rootNode.textContent,
      'Firefox for iOS does not currently support add-ons.');
  });

  it('renders a notice for iOS users instead of a version mismatch', () => {
    const root = render({
      minVersion: '9.0',
      userAgentInfo: {
        browser: { name: 'Firefox', version: '8.0' },
        os: { name: 'iOS' },
      },
    });
    const rootNode = findDOMNode(root);

    assert.include(rootNode.textContent,
      'Firefox for iOS does not currently support add-ons.');
  });
});
