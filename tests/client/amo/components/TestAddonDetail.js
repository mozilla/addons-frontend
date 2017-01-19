import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Simulate,
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import {
  AddonDetailBase,
  allowedDescriptionTags,
} from 'amo/components/AddonDetail';
import AddonMeta from 'amo/components/AddonMeta';
import { RatingManagerWithI18n } from 'amo/components/RatingManager';
import createStore from 'amo/store';
import { ADDON_TYPE_THEME } from 'core/constants';
import InstallButton from 'core/components/InstallButton';
import { fakeAddon } from 'tests/client/amo/helpers';


function renderProps({ addon = fakeAddon, setCurrentStatus = sinon.spy(), ...customProps } = {}) {
  const initialState = { api: { clientApp: 'android', lang: 'pt' } };
  return {
    addon,
    ...addon,
    // Configure AddonDetail with a non-redux depdendent RatingManager.
    RatingManager: RatingManagerWithI18n,
    setCurrentStatus,
    store: createStore(initialState),
    ...customProps,
  };
}

function render(...args) {
  const { store, ...props } = renderProps(...args);
  return findRenderedComponentWithType(renderIntoDocument(
    <Provider store={store}>
      <AddonDetailBase {...props} />
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
                                               RatingManagerWithI18n);
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
    const src = rootNode.querySelector('.AddonDetail-icon img').getAttribute('src');
    assert.equal(src, iconURL);
  });

  it('renders a fall-back asset', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        icon_url: 'http://foo.com/whatever.jpg',
      },
    });
    const src = rootNode.querySelector('.AddonDetail-icon img').getAttribute('src');
    assert.include(src, 'image/png');
  });

  it('renders a theme preview as an img before mounting', () => {
    const root = render({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
      },
      getBrowserThemeData: () => '{}',
    });
    const rootNode = findDOMNode(root);
    root.setState({ mounted: false });

    const image = rootNode.querySelector('.AddonDetail-theme-header-image');
    assert.equal(image.tagName, 'IMG');
    assert.ok(image.classList.contains('AddonDetail-theme-header-image'));
    assert.equal(image.src, 'https://amo/preview.png');
    assert.equal(image.alt, 'Press to preview');
  });

  it('sets mounted in the state in componentDidMount', () => {
    const root = render({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
      },
      getBrowserThemeData: () => '{}',
    });
    root.setState({ mounted: false });

    root.componentDidMount();

    assert.equal(root.state.mounted, true);
  });

  it('renders a theme preview as a background image when mounted', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
      },
      getBrowserThemeData: () => '{}',
    });
    const image = rootNode.querySelector('.AddonDetail-theme-header-image');
    assert.equal(image.style.backgroundImage, 'url("https://amo/preview.png")');
  });

  it('sets the browsertheme data on the header', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
      },
      getBrowserThemeData: () => '{"the":"themedata"}',
    });
    const header = rootNode.querySelector('.AddonDetail-theme-header');
    assert.equal(header.dataset.browsertheme, '{"the":"themedata"}');
  });

  it('previews a theme on touchstart', () => {
    const previewTheme = sinon.spy();
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      getBrowserThemeData: () => '{}',
      previewTheme,
    });
    const header = rootNode.querySelector('.AddonDetail-theme-header');
    Simulate.touchStart(header);
    assert.ok(previewTheme.calledWith(header));
  });

  it('resets a theme preview on touchend', () => {
    const resetPreviewTheme = sinon.spy();
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      getBrowserThemeData: () => '{}',
      resetPreviewTheme,
    });
    const header = rootNode.querySelector('.AddonDetail-theme-header');
    Simulate.touchEnd(header);
    assert.ok(resetPreviewTheme.calledWith(header));
  });

  it('renders an AddonMoreInfo component when there is an add-on', () => {
    const rootNode = renderAsDOMNode();

    assert.ok(rootNode.querySelector('.AddonMoreInfo-contents'));
  });

  it('renders meta data with add-on props', () => {
    const root = render({ addon: { ...fakeAddon, average_daily_users: 25 } });
    const metaData = findRenderedComponentWithType(root, AddonMeta);
    assert.equal(metaData.props.averageDailyUsers, 25);
  });
});
