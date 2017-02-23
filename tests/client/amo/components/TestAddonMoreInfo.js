import deepcopy from 'deepcopy';
import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import { AddonMoreInfoBase } from 'amo/components/AddonMoreInfo';
import { fakeAddon } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<AddonMoreInfo />', () => {
  const initialState = { api: { clientApp: 'android', lang: 'pt' } };

  function render(props) {
    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <AddonMoreInfoBase i18n={getFakeI18nInst()} addon={fakeAddon}
          {...props} />
      </Provider>
    ), AddonMoreInfoBase);
  }

  it('does not render a homepage if none exists', () => {
    const partialAddon = deepcopy(fakeAddon);
    delete partialAddon.homepage;
    const root = render({ addon: partialAddon });

    assert.equal(root.homepageLink, undefined);
  });

  it('renders the homepage of an add-on', () => {
    const root = render();

    assert.equal(root.homepageLink.textContent, 'hamsterdance.com/');
    assert.equal(root.homepageLink.tagName, 'A');
    assert.equal(root.homepageLink.href, 'http://hamsterdance.com/');
  });

  it('adds a protocol to a homepage URL if missing', () => {
    const root = render({ addon: { ...fakeAddon, homepage: 'test.com' } });

    assert.equal(root.homepageLink.textContent, 'test.com');
    assert.equal(root.homepageLink.tagName, 'A');
    assert.equal(root.homepageLink.href, 'http://test.com/');
  });

  it('trims leading whitespace on a URL', () => {
    const root = render({ addon: { ...fakeAddon, homepage: ' test.com ' } });

    assert.equal(root.homepageLink.textContent, 'test.com');
    assert.equal(root.homepageLink.tagName, 'A');
    assert.equal(root.homepageLink.href, 'http://test.com/');
  });

  it('works with HTTPS URLs', () => {
    const root = render(
      { addon: { ...fakeAddon, homepage: 'https://test.com' } });

    assert.equal(root.homepageLink.textContent, 'test.com');
    assert.equal(root.homepageLink.tagName, 'A');
    assert.equal(root.homepageLink.href, 'https://test.com/');
  });

  it('renders the version number of an add-on', () => {
    const root = render();

    assert.equal(root.version.textContent, '2.0.0');
    assert.equal(root.version.tagName, 'DD');
  });

  it('renders the license and link', () => {
    const root = render();

    assert.equal(root.licenseHeader.textContent, 'License');
    assert.equal(root.licenseLink.textContent, 'tofulicense');
    assert.equal(root.licenseLink.tagName, 'A');
    assert.equal(root.licenseLink.href, 'http://license.com/');
  });

  it('does not render a privacy policy if none exists', () => {
    const partialAddon = deepcopy(fakeAddon);
    partialAddon.has_privacy_policy = false;
    const root = render({ addon: partialAddon });

    assert.equal(root.privacyPolicyLink, undefined);
  });

  it('renders the privacy policy and link', () => {
    const root = render();

    assert.equal(findDOMNode(root.privacyPolicyLink).textContent,
      'Read the privacy policy for this add-on');
    // TODO: Change this to an internal `<Link>` tag and use `assert.equal`
    // once https://github.com/mozilla/addons-frontend/issues/1828 is fixed.
    assert.include(root.privacyPolicyLink.href,
      '/addon/chill-out/privacy/');
  });
});
