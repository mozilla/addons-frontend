import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import AddonCompatibility from 'amo/components/AddonCompatibility';
import createStore from 'amo/store';
import { fakeAddon, signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst, userAgents } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';


describe('AddonCompatibility', () => {
  function render({ ...props }) {
    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore({ api: signedInApiState })}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <AddonCompatibility addon={fakeAddon} {...props} />
        </I18nProvider>
      </Provider>
    ), AddonCompatibility);
  }

  it('renders nothing if add-on is compatible', () => {
    const root = render({ isCompatibleWithUserAgent: () => true });
    const rootNode = findDOMNode(root);

    assert.equal(rootNode, null);
  });

  it('does not show a notice for a version at the max version', () => {
    const root = render({
      maxVersion: '10.0',
      // This is Firefox 10 on Linux.
      userAgent: userAgents.firefox[0],
    });
    const rootNode = findDOMNode(root);

    assert.equal(rootNode, null);
  });

  it('renders component if add-on is not compatible', () => {
    const root = render({ isCompatibleWithUserAgent: () => false });
    const rootNode = findDOMNode(root);

    assert(rootNode);
  });

  it('renders a notice for non-Firefox browsers', () => {
    const root = render({
      isCompatibleWithUserAgent: () => false,
      userAgent: userAgents.chrome[0],
    });
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
      // This is Firefox 10 on Linux.
      userAgent: userAgents.firefox[0],
    });
    const rootNode = findDOMNode(root);

    // This is localised to the current locale, which is en-US in our
    // signedInApiState helper.
    assert.equal(rootNode.querySelector('a').href,
      'https://www.mozilla.org/en-US/firefox/');
    assert.include(rootNode.textContent,
      'This add-on requires a newer version of Firefox');
    assert.include(rootNode.textContent, '(at least version 11.0)');
    assert.include(rootNode.textContent, 'You are using Firefox 10.');
  });

  it('renders a notice for new versions of Firefox', () => {
    const root = render({
      maxVersion: '9.4',
      // This is Firefox 10 on Linux.
      userAgent: userAgents.firefox[0],
    });
    const rootNode = findDOMNode(root);

    assert.include(rootNode.textContent,
      'This add-on is only compatible with older versions of Firefox');
    assert.include(rootNode.textContent, '(up to version 9.4)');
    assert.include(rootNode.textContent, 'You are using Firefox 10.');
  });

  it('renders a notice for iOS users', () => {
    const root = render({
      isCompatibleWithUserAgent: () => false,
      userAgent: userAgents.firefoxIOS[0],
    });
    const rootNode = findDOMNode(root);

    assert.include(rootNode.textContent,
      'Firefox for iOS does not currently support add-ons.');
  });
});
