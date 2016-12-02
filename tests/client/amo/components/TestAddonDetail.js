import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import {
  AddonDetailBase,
  allowedDescriptionTags,
} from 'amo/components/AddonDetail';
import { OverallRatingWithI18n } from 'amo/components/OverallRating';
import createStore from 'amo/store';
import I18nProvider from 'core/i18n/Provider';
import InstallButton from 'core/components/InstallButton';
import { fakeAddon } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';


function render({ addon = fakeAddon, setCurrentStatus = sinon.spy(), ...customProps } = {}) {
  const i18n = getFakeI18nInst();
  const initialState = { api: { clientApp: 'android', lang: 'pt' } };
  const props = {
    addon,
    ...addon,
    i18n,
    // Configure AddonDetail with a non-redux depdendent OverallRating.
    OverallRating: OverallRatingWithI18n,
    setCurrentStatus,
    ...customProps,
  };

  return findRenderedComponentWithType(renderIntoDocument(
    <Provider store={createStore(initialState)}>
      <I18nProvider i18n={i18n}>
        <AddonDetailBase {...props} />
      </I18nProvider>
    </Provider>
  ), AddonDetailBase);
}

function renderAsDOMNode(...args) {
  const root = render(...args);
  return findDOMNode(root);
}

describe('AddonDetail', () => {
  it('renders a name', () => {
    const rootNode = renderAsDOMNode();
    assert.include(rootNode.querySelector('h1').textContent,
                   'Chill Out');
  });

  it('gets the add-on status on componentDidMount()', () => {
    const setCurrentStatus = sinon.spy();
    renderAsDOMNode({ setCurrentStatus });
    assert.ok(setCurrentStatus.called);
  });

  it('renders a single author', () => {
    const authorUrl = 'http://olympia.dev/en-US/firefox/user/krupa/';
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        authors: [{
          name: 'Krupa',
          url: authorUrl,
        }],
      },
    });
    assert.equal(rootNode.querySelector('h1').textContent,
                 'Chill Out by Krupa');
    assert.equal(rootNode.querySelector('h1 a').attributes.href.value,
                 authorUrl);
  });

  it('renders multiple authors', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        authors: [{
          name: 'Krupa',
          url: 'http://olympia.dev/en-US/firefox/user/krupa/',
        }, {
          name: 'Fligtar',
          url: 'http://olympia.dev/en-US/firefox/user/fligtar/',
        }],
      },
    });
    assert.equal(rootNode.querySelector('h1').textContent,
                 'Chill Out by Krupa, Fligtar');
  });

  it('sanitizes a title', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        name: '<script>alert(document.cookie);</script>',
      },
    });
    // Make sure an actual script tag was not created.
    assert.equal(rootNode.querySelector('h1 script'), null);
    // Make sure the script HTML has been escaped and removed.
    assert.notInclude(rootNode.querySelector('h1').textContent, 'script');
  });

  it('allows certain HTML tags in the title', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        authors: [{
          name: 'Krupa',
          url: 'http://olympia.dev/en-US/firefox/user/krupa/',
        }],
      },
    });
    // Make sure these tags were whitelisted.
    assert.equal(rootNode.querySelector('h1 span a').textContent, 'Krupa');
    // Make sure the santizer didn't strip the class attribute:
    const byLine = rootNode.querySelector('h1 span');
    assert.ok(byLine.attributes.class, 'the class attribute is not empty');
  });

  it('configures the install button', () => {
    const root = findRenderedComponentWithType(render(), InstallButton);
    assert.equal(root.props.slug, fakeAddon.slug);
  });

  it('sets the type in the header', () => {
    const rootNode = renderAsDOMNode();
    assert.include(rootNode.querySelector('.AddonDescription h2').textContent,
                   'About this extension');
  });

  it('sanitizes bad description HTML', () => {
    const scriptHTML = '<script>alert(document.cookie);</script>';
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        description: scriptHTML,
      },
    });
    // Make sure an actual script tag was not created.
    assert.equal(rootNode.querySelector('.AddonDescription script'), null);
    // Make sure the script HTML has been escaped and removed.
    assert.notInclude(
      rootNode.querySelector('.AddonDescription').textContent, scriptHTML);
  });

  it('converts new lines in the description to breaks', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        description: '\n\n\n',
      },
    });
    assert.lengthOf(rootNode.querySelectorAll('.AddonDescription br'), 3);
  });

  it('preserves certain HTML tags in the description', () => {
    let description = '';
    const allowedTags = [...allowedDescriptionTags];
    // Ignore <br/> since it's checked elsewhere.
    allowedTags.splice(allowedTags.indexOf('br'), 1);
    // eslint-disable-next-line no-restricted-syntax
    for (const tag of allowedTags) {
      description = `${description} <${tag}>placeholder</${tag}>`;
    }
    const rootNode = renderAsDOMNode({ addon: { ...fakeAddon, description } });
    // eslint-disable-next-line no-restricted-syntax
    for (const tagToCheck of allowedTags) {
      assert.lengthOf(
        rootNode.querySelectorAll(`.AddonDescription-contents ${tagToCheck}`),
        1, `${tagToCheck} tag was not whitelisted`
      );
    }
  });

  it('strips dangerous HTML tag attributes from description', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        description:
          '<a href="javascript:alert(document.cookie)" onclick="sneaky()">placeholder</a>',
      },
    });
    const anchor = rootNode.querySelector('.AddonDescription a');
    assert.equal(anchor.attributes.onclick, null);
    assert.equal(anchor.attributes.href, null);
  });

  it('configures the overall ratings section', () => {
    const root = findRenderedComponentWithType(render(),
                                               OverallRatingWithI18n);
    assert.deepEqual(root.props.addon, fakeAddon);
  });

  it('renders a summary', () => {
    const rootNode = renderAsDOMNode();
    assert.include(
      rootNode.querySelector('.AddonDetail-summary').textContent,
      fakeAddon.summary
    );
  });

  it('renders an amo CDN icon image', () => {
    const iconURL = 'https://addons.cdn.mozilla.net/foo.jpg';
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        icon_url: iconURL,
      },
    });
    const src = rootNode.querySelector('.icon img').getAttribute('src');
    assert.equal(src, iconURL);
  });

  it('renders a fall-back asset', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        icon_url: 'http://foo.com/whatever.jpg',
      },
    });
    const src = rootNode.querySelector('.icon img').getAttribute('src');
    assert.include(src, 'image/png');
  });

  it('renders an AddonMoreInfo component when there is an add-on', () => {
    const rootNode = renderAsDOMNode();

    assert.ok(rootNode.querySelector('.AddonMoreInfo-contents'));
  });
});
