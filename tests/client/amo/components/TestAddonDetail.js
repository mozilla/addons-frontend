/* global window */
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
  mapStateToProps,
} from 'amo/components/AddonDetail';
import AddonMeta from 'amo/components/AddonMeta';
import Link from 'amo/components/Link';
import routes from 'amo/routes';
import { RatingManagerWithI18n } from 'amo/components/RatingManager';
import createStore from 'amo/store';
import { loadEntities } from 'core/actions';
import { setInstallState } from 'core/actions/installations';
import {
  ADDON_TYPE_THEME,
  INCOMPATIBLE_NOT_FIREFOX,
} from 'core/constants';
import InstallButton from 'core/components/InstallButton';
import { INSTALLED, UNKNOWN } from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import {
  dispatchSignInActions, fakeAddon, signedInApiState,
} from 'tests/client/amo/helpers';
import {
  createFetchAddonResult, getFakeI18nInst, sampleUserAgentParsed,
} from 'tests/client/helpers';


function renderProps({ addon = fakeAddon, setCurrentStatus = sinon.spy(), ...customProps } = {}) {
  const i18n = getFakeI18nInst();
  return {
    addon,
    ...addon,
    getClientCompatibility: () => ({ compatible: true, reason: null }),
    getBrowserThemeData: () => '{}',
    i18n,
    location: { pathname: '/addon/detail/' },
    // Configure AddonDetail with a non-redux depdendent RatingManager.
    RatingManager: RatingManagerWithI18n,
    setCurrentStatus,
    store: createStore({ api: signedInApiState }).store,
    ...customProps,
  };
}

function render(...args) {
  const { store, i18n, ...props } = renderProps(...args);
  props.i18n = i18n;
  return findRenderedComponentWithType(renderIntoDocument(
    <Provider store={store}>
      <I18nProvider i18n={i18n}>
        <AddonDetailBase store={store} {...props} />
      </I18nProvider>
    </Provider>
  ), AddonDetailBase);
}

function renderAsDOMNode(...args) {
  const root = render(...args);
  return findDOMNode(root);
}

describe('AddonDetail', () => {
  const incompatibleClientResult = {
    compatible: false,
    maxVersion: null,
    minVersion: null,
    reason: INCOMPATIBLE_NOT_FIREFOX,
  };
  const getClientCompatibilityFalse = () => incompatibleClientResult;

  it('renders a name', () => {
    const rootNode = renderAsDOMNode();
    expect(rootNode.querySelector('h1').textContent).toContain('Chill Out');
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
    expect(rootNode.querySelector('h1').textContent).toEqual('Chill Out by Krupa');
    expect(rootNode.querySelector('h1 a').attributes.href.value).toEqual(authorUrl);
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
    expect(rootNode.querySelector('h1').textContent).toEqual('Chill Out by Krupa, Fligtar');
  });

  it('sanitizes a title', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        name: '<script>alert(document.cookie);</script>',
      },
    });
    // Make sure an actual script tag was not created.
    expect(rootNode.querySelector('h1 script')).toEqual(null);
    // Make sure the script removed.
    expect(rootNode.querySelector('h1').innerHTML).not.toContain('<script>');
  });

  it('sanitizes a summary', () => {
    const scriptHTML = '<script>alert(document.cookie);</script>';
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        summary: scriptHTML,
      },
    });
    // Make sure an actual script tag was not created.
    expect(rootNode.querySelector('.AddonDetail-summary script')).toEqual(null);
    // Make sure the script has been removed.
    expect(rootNode.querySelector('.AddonDetail-summary').innerHTML).not.toContain('<script>');
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
    expect(rootNode.querySelector('.AddonDescription script')).toEqual(null);
    // Make sure the script has been removed.
    expect(rootNode.querySelector('.AddonDescription').innerHTML).not.toContain('<script>');
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
    expect(rootNode.querySelector('h1 span a').textContent).toEqual('Krupa');
    // Make sure the santizer didn't strip the class attribute:
    const byLine = rootNode.querySelector('h1 span');
    expect(byLine.attributes.class).toBeTruthy();
  });

  it('configures the install button', () => {
    const root = findRenderedComponentWithType(render(), InstallButton);
    expect(root.props.slug).toEqual(fakeAddon.slug);
  });

  it('sets the type in the header', () => {
    const rootNode = renderAsDOMNode();
    expect(rootNode.querySelector('.AddonDescription h2').textContent).toContain('About this extension');
  });

  it('uses the summary as the description if no description exists', () => {
    const addon = { ...fakeAddon, summary: 'short text' };
    delete addon.description;
    const rootNode = renderAsDOMNode({ addon });
    expect(rootNode.querySelector('.AddonDescription-contents').textContent).toEqual(addon.summary);
  });

  it('uses the summary as the description if description is blank', () => {
    const addon = { ...fakeAddon, description: '', summary: 'short text' };
    const rootNode = renderAsDOMNode({ addon });
    expect(rootNode.querySelector('.AddonDescription-contents').textContent).toEqual(addon.summary);
  });

  it('converts new lines in the description to breaks', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        description: '\n\n\n',
      },
    });
    expect(rootNode.querySelectorAll('.AddonDescription br').length).toBe(3);
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
      expect(
        rootNode.querySelectorAll(`.AddonDescription-contents ${tagToCheck}`).length
      ).toBe(1);
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
    expect(anchor.getAttribute('onclick')).toEqual(null);
    expect(anchor.getAttribute('href')).toEqual(null);
  });

  it('configures the overall ratings section', () => {
    const location = { pathname: '/en-US/firefox/addon/some-slug/' };
    const root = findRenderedComponentWithType(render({ location }),
                                               RatingManagerWithI18n);
    expect(root.props.addon).toEqual(fakeAddon);
    expect(root.props.location).toEqual(location);
  });

  it('renders a summary', () => {
    const rootNode = renderAsDOMNode();
    expect(rootNode.querySelector('.AddonDetail-summary').textContent).toContain(fakeAddon.summary);
  });

  it('renders a summary with links', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        summary: '<a href="http://foo.com/">my website</a>',
      },
    });
    expect(rootNode.querySelector('.AddonDetail-summary').textContent).toContain('my website');
    expect(rootNode.querySelectorAll('.AddonDetail-summary a').length).toEqual(1);
    expect(rootNode.querySelector('.AddonDetail-summary a').href).toEqual('http://foo.com/');
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
    expect(src).toEqual(iconURL);
  });

  it('renders a fall-back asset', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        icon_url: 'http://foo.com/whatever.jpg',
      },
    });
    const src = rootNode.querySelector('.AddonDetail-icon img').getAttribute('src');
    expect(src).toEqual('default-64.png');
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
    expect(image.tagName).toEqual('IMG');
    expect(image.classList.contains('AddonDetail-theme-header-image')).toBeTruthy();
    expect(image.src).toEqual('https://amo/preview.png');
    expect(image.alt).toEqual('Tap to preview');
  });

  it('enables a theme preview for supported clients', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
    });
    const button = rootNode.querySelector('.AddonDetail-theme-header-label');
    expect(button.disabled).toEqual(false);
  });

  it('disables install switch for unsupported clients', () => {
    const rootNode = renderAsDOMNode({
      getClientCompatibility: getClientCompatibilityFalse,
    });
    expect(rootNode.querySelector('.InstallButton-switch input').disabled).toBe(true);
  });

  it('throws an error if compatibility props are missing', () => {
    const compatibilityResult = { ...incompatibleClientResult };
    delete compatibilityResult.minVersion;
    expect(() => {
      renderAsDOMNode({ getClientCompatibility: () => compatibilityResult });
    }).toThrowError(/minVersion is required/);
  });

  it('disables a theme preview for unsupported clients', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      getClientCompatibility: getClientCompatibilityFalse,
    });
    const button = rootNode.querySelector('.AddonDetail-theme-header-label');
    expect(button.disabled).toEqual(true);
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
    expect(resetThemePreview.calledWith('theme-preview-node')).toBeTruthy();
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
    expect(header.getAttribute('data-browsertheme')).toEqual('{"the":"themedata"}');
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
    expect(toggleThemePreview.calledWith(header)).toBeTruthy();
  });

  it('renders an AddonMoreInfo component when there is an add-on', () => {
    const rootNode = renderAsDOMNode();

    expect(rootNode.querySelector('.AddonMoreInfo-contents')).toBeTruthy();
  });

  it('renders meta data for the add-on', () => {
    const root = render({ addon: fakeAddon });
    const metaData = findRenderedComponentWithType(root, AddonMeta);
    expect(metaData.props.addon).toEqual(fakeAddon);
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
      expect(footer.textContent).toEqual('No reviews yet');
      expect(root.querySelector('footer').className).toEqual('Card-footer-text');
    });

    it('prompts you to read one review', () => {
      const root = reviewFooterDOM({
        ratingsCount: 1,
      });
      const footer =
        root.querySelector('.AddonDetail-read-reviews-footer');
      expect(footer.textContent).toEqual('Read 1 review');
      expect(root.querySelector('footer').className).toEqual('Card-footer-link');
    });

    it('prompts you to read many reviews', () => {
      const root = reviewFooterDOM({
        ratingsCount: 5,
      });
      const footer =
        root.querySelector('.AddonDetail-read-reviews-footer');
      expect(footer.textContent).toEqual('Read all 5 reviews');
    });

    it('localizes the review count', () => {
      const root = reviewFooterDOM({
        ratingsCount: 10000,
      });
      const footer =
        root.querySelector('.AddonDetail-read-reviews-footer');
      expect(footer.textContent).toContain('10,000');
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
      expect(allLinks.length).toEqual(1);

      const link = allLinks[0];
      const path = link.props.to;
      expect(path).toEqual('/addon/chill-out/reviews/');

      return new Promise((resolve, reject) => {
        match({ location: path, routes }, (error, redirectLocation, props) => {
          if (error) {
            return reject(error);
          }
          // Check to make sure it is a valid routed path.
          expect(props).toBeTruthy();
          return resolve();
        });
      });
    });
  });
});

describe('AddonDetals mapStateToProps', () => {
  let store;

  beforeEach(() => {
    store = createStore().store;
  });

  function signIn(params) {
    dispatchSignInActions({ store, ...params });
  }

  function fetchAddon({ addon = fakeAddon } = {}) {
    store.dispatch(loadEntities(createFetchAddonResult(addon).entities));
  }

  function _mapStateToProps(
    state = store.getState(),
    ownProps = { params: { slug: fakeAddon.slug } },
  ) {
    return mapStateToProps(state, ownProps);
  }

  it('sets the clientApp and userAgent', () => {
    const clientAppFromAgent = 'firefox';
    signIn({ clientApp: clientAppFromAgent });
    fetchAddon();
    const { clientApp, userAgentInfo } = _mapStateToProps();

    expect(clientApp).toEqual(clientAppFromAgent);
    const { browser, os } = sampleUserAgentParsed;
    expect(userAgentInfo).toEqual({ browser, os });
  });

  it('pulls the add-on from state', () => {
    signIn();
    fetchAddon();
    store.dispatch(setInstallState({
      guid: fakeAddon.guid, needsRestart: false, status: INSTALLED,
    }));
    const { status } = _mapStateToProps();

    // TODO: test all the spread props here.
    // expect(props).toEqual({
    // addon, ...addon, ...installation });
  });

  it('sets status to INSTALLED when add-on is installed', () => {
    signIn();
    fetchAddon();
    store.dispatch(setInstallState({
      guid: fakeAddon.guid, needsRestart: false, status: INSTALLED,
    }));
    const { status } = _mapStateToProps();

    expect(status).toEqual(INSTALLED);
  });

  it('sets status to UNKNOWN when add-on is not installed', () => {
    signIn();
    fetchAddon();
    const { status } = _mapStateToProps();

    expect(status).toEqual(UNKNOWN);
  });
});
