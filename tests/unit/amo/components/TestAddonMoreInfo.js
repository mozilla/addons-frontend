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
import { fakeAddon } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('<AddonMoreInfo />', () => {
  const initialState = { api: { clientApp: 'android', lang: 'pt' } };
  const { store } = createStore(initialState);

  function render(props) {
    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <AddonMoreInfoBase
          i18n={getFakeI18nInst()}
          addon={fakeAddon}
          {...props}
        />
      </Provider>
    ), AddonMoreInfoBase);
  }

  it('does renders a link <dt> if links exist', () => {
    const partialAddon = {
      ...fakeAddon,
      homepage: null,
      support_url: 'foo.com',
    };
    const root = render({ addon: partialAddon });

    expect(root.linkTitle.textContent).toEqual('Add-on Links');
  });

  it('does not render a link <dt> if no links exist', () => {
    const partialAddon = deepcopy(fakeAddon);
    delete partialAddon.homepage;
    delete partialAddon.support_url;
    const root = render({ addon: partialAddon });

    expect(root.linkTitle).toEqual(undefined);
  });

  it('does not render a homepage if none exists', () => {
    const partialAddon = deepcopy(fakeAddon);
    delete partialAddon.homepage;
    const root = render({ addon: partialAddon });

    expect(root.homepageLink).toEqual(undefined);
  });

  it('renders the homepage of an add-on', () => {
    const root = render();

    expect(root.homepageLink.textContent).toEqual('Homepage');
    expect(root.homepageLink.tagName).toEqual('A');
    expect(root.homepageLink.href).toEqual('http://hamsterdance.com/');
  });

  it('does not render a support link if none exists', () => {
    const partialAddon = deepcopy(fakeAddon);
    delete partialAddon.support_url;
    const root = render({ addon: partialAddon });

    expect(root.supportLink).toEqual(undefined);
  });

  it('renders the support link of an add-on', () => {
    const root = render();

    expect(root.supportLink.textContent).toEqual('Support Site');
    expect(root.supportLink.tagName).toEqual('A');
    expect(root.supportLink.href).toEqual('http://support.hampsterdance.com/');
  });

  it('renders the version number of an add-on', () => {
    const root = render();

    expect(root.version.textContent).toEqual('2.0.0');
    expect(root.version.tagName).toEqual('DD');
  });

  it('renders the license and link', () => {
    const root = render();

    expect(root.licenseHeader.textContent).toEqual('License');
    expect(root.licenseLink.textContent).toEqual('tofulicense');
    expect(root.licenseLink.tagName).toEqual('A');
    expect(root.licenseLink.href).toEqual('http://license.com/');
  });

  it('does not render a privacy policy if none exists', () => {
    const partialAddon = { ...fakeAddon, has_privacy_policy: false };
    const root = render({ addon: partialAddon });

    expect(root.privacyPolicyLink).toEqual(undefined);
  });

  it('renders the privacy policy and link', () => {
    const addon = { ...fakeAddon, has_privacy_policy: true };
    const root = render({ addon });

    expect(findDOMNode(root.privacyPolicyLink).textContent).toEqual('Read the privacy policy for this add-on');
    // TODO: Change this to an internal `<Link>` tag and use `expect().toBe`
    // once https://github.com/mozilla/addons-frontend/issues/1828 is fixed.
    expect(root.privacyPolicyLink.props.href).toContain('/addon/chill-out/privacy/');
  });

  it('renders the EULA and link', () => {
    const addon = { ...fakeAddon, has_eula: true };
    const root = render({ addon });

    expect(findDOMNode(root.eulaLink).textContent)
      .toEqual('Read the license agreement for this add-on');
    expect(root.eulaLink.props.href).toContain('/addon/chill-out/eula/');
  });

  it('does not render a EULA if none exists', () => {
    const partialAddon = { ...fakeAddon, has_eula: false };
    const root = render({ addon: partialAddon });

    expect(root.eulaLink).toEqual(undefined);
  });
});
