import React from 'react';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import { MoreInfoBase } from 'amo/components/MoreInfo';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<MoreInfo />', () => {
  const initialState = { api: { clientApp: 'android', lang: 'pt' } };
  const addon = {
    current_version: { id: 20 },
    homepage: 'http://hamsterdance.com/',
    has_privacy_policy: true,
    slug: 'my-addon',
  };

  function render(props) {
    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <MoreInfoBase i18n={getFakeI18nInst()} addon={addon} {...props} />
      </Provider>
    ), MoreInfoBase);
  }

  it('renders loading when loading more info', () => {
    const rootNode = findDOMNode(render({ versionDetails: { loading: true } }));

    assert.equal(rootNode.querySelector('.MoreInfo-contents').textContent,
      'Loading...');
  });

  it('does not render a homepage if none exists', () => {
    const root = render({ addon: {
      current_version: { id: 20, version: '1.0' },
    } });

    assert.equal(root.homepageLink, undefined);
  });

  it('renders the homepage of an add-on', () => {
    const root = render();

    assert.equal(root.homepageLink.textContent, 'http://hamsterdance.com/');
    assert.equal(root.homepageLink.tagName, 'A');
    assert.equal(root.homepageLink.href, 'http://hamsterdance.com/');
  });

  it('renders the license and link', () => {
    const root = render({ versionDetails: {
      license: { name: 'tofulicense', url: 'http://license.com/' },
    } });

    assert.equal(root.licenseHeader.textContent, 'License');
    assert.equal(root.licenseLink.textContent, 'tofulicense');
    assert.equal(root.licenseLink.tagName, 'A');
    assert.equal(root.licenseLink.href, 'http://license.com/');
  });

  it('does not render a privacy policy if none exists', () => {
    const root = render({ addon: {
      current_version: { id: 20, version: '1.0' },
      has_privacy_policy: false,
    } });

    assert.equal(root.privacyPolicyLink, undefined);
  });

  it('renders the privacy policy and link', () => {
    const root = render();

    assert.equal(findDOMNode(root.privacyPolicyLink).textContent,
      'Read the privacy policy for this add-on');
    assert.equal(root.privacyPolicyLink.props.to,
      '/addons/addon/my-addon/privacy-policy/');
  });
});
