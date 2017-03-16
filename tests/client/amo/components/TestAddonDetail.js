import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  Simulate,
  scryRenderedComponentsWithType,
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';
import { match } from 'react-router';

import {
  AddonDetailBase,
  allowedDescriptionTags,
} from 'amo/components/AddonDetail';
import AddonMeta from 'amo/components/AddonMeta';
import Link from 'amo/components/Link';
import routes from 'amo/routes';
import { RatingManagerWithI18n } from 'amo/components/RatingManager';
import createStore from 'amo/store';
import { ADDON_TYPE_THEME } from 'core/constants';
import InstallButton from 'core/components/InstallButton';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';


function renderProps({ addon = fakeAddon, setCurrentStatus = sinon.spy(), ...customProps } = {}) {
  const i18n = getFakeI18nInst();
  const initialState = { api: { clientApp: 'android', lang: 'pt' } };
  return {
    addon,
    ...addon,
    clientSupportsAddons: () => true,
    getBrowserThemeData: () => '{}',
    i18n,
    location: { pathname: '/addon/detail/' },
    // Configure AddonDetail with a non-redux depdendent RatingManager.
    RatingManager: RatingManagerWithI18n,
    setCurrentStatus,
    store: createStore(initialState),
    ...customProps,
  };
}

function render(...args) {
  const { store, i18n, ...props } = renderProps(...args);
  props.i18n = i18n;
  return findRenderedComponentWithType(renderIntoDocument(
    <Provider store={store}>
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

  it('uses the summary as the description if no description exists', () => {
    const addon = { ...fakeAddon, summary: 'short text' };
    delete addon.description;
    const rootNode = renderAsDOMNode({ addon });
    assert.equal(
      rootNode.querySelector('.AddonDescription-contents').textContent,
      addon.summary);
  });

  it('uses the summary as the description if description is blank', () => {
    const addon = { ...fakeAddon, description: '', summary: 'short text' };
    const rootNode = renderAsDOMNode({ addon });
    assert.equal(
      rootNode.querySelector('.AddonDescription-contents').textContent,
      addon.summary);
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
    const location = { pathname: '/en-US/firefox/addon/some-slug/' };
    const root = findRenderedComponentWithType(render({ location }),
                                               RatingManagerWithI18n);
    assert.deepEqual(root.props.addon, fakeAddon);
    assert.deepEqual(root.props.location, location);
  });

  it('renders a summary', () => {
    const rootNode = renderAsDOMNode();
    assert.include(
      rootNode.querySelector('.AddonDetail-summary').textContent,
      fakeAddon.summary
    );
  });

  it('renders a summary with links', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        summary: '<a href="http://foo.com/">my website</a>',
      },
    });
    assert.include(
      rootNode.querySelector('.AddonDetail-summary').textContent, 'my website');
    assert.equal(rootNode.querySelectorAll('.AddonDetail-summary a').length, 1);
    assert.equal(
      rootNode.querySelector('.AddonDetail-summary a').href, 'http://foo.com/');
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

  it('renders a theme preview as an img', () => {
    const root = render({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
      },
    });
    const rootNode = findDOMNode(root);
    const image = rootNode.querySelector('.AddonDetail-theme-header-image');
    assert.equal(image.tagName, 'IMG');
    assert.ok(image.classList.contains('AddonDetail-theme-header-image'));
    assert.equal(image.src, 'https://amo/preview.png');
    assert.equal(image.alt, 'Tap to preview');
  });

  it('enables a theme preview for supported clients', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      clientSupportsAddons: () => true,
    });
    const button = rootNode.querySelector('.AddonDetail-theme-header-label');
    assert.equal(button.disabled, false);
  });

  it('disables a theme preview for unsupported clients', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      clientSupportsAddons: () => false,
    });
    const button = rootNode.querySelector('.AddonDetail-theme-header-label');
    assert.equal(button.disabled, true);
  });

  it('unsets the theme preview on component unmount', () => {
    const resetThemePreview = sinon.spy();
    const root = render({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
        isPreviewingTheme: true,
        themePreviewNode: 'theme-preview-node',
        resetThemePreview,
      },
    });
    root.componentWillUnmount();
    assert.ok(resetThemePreview.calledWith('theme-preview-node'));
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

  it('toggles a theme on click', () => {
    const toggleThemePreview = sinon.spy();
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      toggleThemePreview,
    });
    const header = rootNode.querySelector('.AddonDetail-theme-header');
    Simulate.click(header);
    assert.ok(toggleThemePreview.calledWith(header));
  });

  it('renders an AddonMoreInfo component when there is an add-on', () => {
    const rootNode = renderAsDOMNode();

    assert.ok(rootNode.querySelector('.AddonMoreInfo-contents'));
  });

  it('renders meta data for the add-on', () => {
    const root = render({ addon: fakeAddon });
    const metaData = findRenderedComponentWithType(root, AddonMeta);
    assert.deepEqual(metaData.props.addon, fakeAddon);
  });

  describe('read reviews footer', () => {
    function reviewFooterDOM({ ratingsCount = 1, ...customProps }) {
      return renderAsDOMNode({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            count: ratingsCount,
          },
        },
        ...customProps,
      });
    }

    it('only links to reviews when they exist', () => {
      const root = reviewFooterDOM({
        ratingsCount: 0,
      });
      const footer =
        root.querySelector('.AddonDetail-read-reviews-footer');
      assert.equal(footer.textContent, 'No reviews yet');
      assert.equal(root.querySelector('footer').className,
                   'Card-footer-text');
    });

    it('prompts you to read one review', () => {
      const root = reviewFooterDOM({
        ratingsCount: 1,
      });
      const footer =
        root.querySelector('.AddonDetail-read-reviews-footer');
      assert.equal(footer.textContent, 'Read 1 review');
      assert.equal(root.querySelector('footer').className,
                   'Card-footer-link');
    });

    it('prompts you to read many reviews', () => {
      const root = reviewFooterDOM({
        ratingsCount: 5,
      });
      const footer =
        root.querySelector('.AddonDetail-read-reviews-footer');
      assert.equal(footer.textContent, 'Read all 5 reviews');
    });

    it('localizes the review count', () => {
      const root = reviewFooterDOM({
        ratingsCount: 10000,
      });
      const footer =
        root.querySelector('.AddonDetail-read-reviews-footer');
      assert.include(footer.textContent, '10,000');
    });

    it('links to all reviews', () => {
      const root = render({
        addon: {
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            count: 2,
          },
        },
      });
      const allLinks = scryRenderedComponentsWithType(root, Link)
        .filter((component) =>
          component.props.className === 'AddonDetail-all-reviews-link');
      assert.equal(allLinks.length, 1);

      const link = allLinks[0];
      const path = link.props.to;
      assert.equal(path, '/addon/chill-out/reviews/');

      return new Promise((resolve, reject) => {
        match({ location: path, routes }, (error, redirectLocation, props) => {
          if (error) {
            return reject(error);
          }
          // Check to make sure it is a valid routed path.
          assert.ok(
            props,
            `props was falsey which means the path ${path} is invalid`);
          return resolve();
        });
      });
    });
  });
});
