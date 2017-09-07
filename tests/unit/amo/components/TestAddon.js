import { shallow } from 'enzyme';
import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  scryRenderedComponentsWithType,
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';
import { match } from 'react-router';

import { setViewContext } from 'amo/actions/viewContext';
import {
  AddonBase,
  mapStateToProps,
} from 'amo/components/Addon';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import NotFound from 'amo/components/ErrorPage/NotFound';
import Link from 'amo/components/Link';
import routes from 'amo/routes';
import RatingManager, {
  RatingManagerWithI18n,
} from 'amo/components/RatingManager';
import createStore from 'amo/store';
import {
  fetchAddon as fetchAddonAction, loadAddons,
} from 'core/reducers/addons';
import { setError } from 'core/actions/errors';
import { setInstallState } from 'core/actions/installations';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_THEME,
  ADDON_TYPE_OPENSEARCH,
  ENABLED,
  INCOMPATIBLE_NOT_FIREFOX,
  INSTALLED,
  UNKNOWN,
} from 'core/constants';
import InstallButton from 'core/components/InstallButton';
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
import { dispatchSignInActions, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFetchAddonResult,
  createStubErrorHandler,
  getFakeI18nInst,
  sampleUserAgentParsed,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import Badge from 'ui/components/Badge';


function renderProps({
  addon = fakeAddon,
  params,
  setCurrentStatus = sinon.spy(),
  ...customProps
} = {}) {
  const i18n = getFakeI18nInst();
  const addonProps = addon || {};
  return {
    addon,
    ...addonProps,
    dispatch: sinon.stub(),
    errorHandler: createStubErrorHandler(),
    getClientCompatibility: () => ({ compatible: true, reason: null }),
    getBrowserThemeData: () => '{}',
    i18n,
    location: { pathname: '/addon/detail/' },
    params: params || { slug: addon.slug },
    // Configure Addon with a non-redux depdendent RatingManager.
    RatingManager: RatingManagerWithI18n,
    setCurrentStatus,
    store: dispatchSignInActions().store,
    ...customProps,
  };
}

function render(...args) {
  const { store, i18n, ...props } = renderProps(...args);
  props.i18n = i18n;
  return findRenderedComponentWithType(renderIntoDocument(
    <Provider store={store}>
      <I18nProvider i18n={i18n}>
        <AddonBase store={store} {...props} />
      </I18nProvider>
    </Provider>
  ), AddonBase);
}

function renderAsDOMNode(...args) {
  const root = render(...args);
  return findDOMNode(root);
}

function shallowRender(...args) {
  const props = renderProps(...args);
  return shallow(<AddonBase {...props} />, { context: { i18n: props.i18n } });
}

describe('Addon', () => {
  const incompatibleClientResult = {
    compatible: false,
    maxVersion: null,
    minVersion: null,
    reason: INCOMPATIBLE_NOT_FIREFOX,
  };
  const getClientCompatibilityFalse = () => incompatibleClientResult;

  it('dispatches setViewContext with addonType', () => {
    const fakeDispatch = sinon.stub();
    shallowRender({ dispatch: fakeDispatch });

    sinon.assert.calledWith(fakeDispatch, setViewContext(fakeAddon.type));
  });

  it('dispatches setViewContext on update', () => {
    const fakeDispatch = sinon.stub();
    const root = shallowRender({ dispatch: fakeDispatch });
    fakeDispatch.reset();
    root.setProps({
      addon: { ...fakeAddon, type: ADDON_TYPE_THEME },
    });

    sinon.assert.calledWith(
      fakeDispatch, setViewContext(ADDON_TYPE_THEME));
  });

  it('dispatches setViewContext when updating with new addon', () => {
    const fakeDispatch = sinon.stub();
    // Start with a null addon
    const root = shallowRender({
      addon: null, dispatch: fakeDispatch, params: { slug: 'some-slug' },
    });
    fakeDispatch.reset();
    // Update with a new addon
    root.setProps({ addon: fakeAddon });

    sinon.assert.calledWith(fakeDispatch, setViewContext(fakeAddon.type));
  });

  it('only dispatches setViewContext for a new addon type', () => {
    const fakeDispatch = sinon.stub();
    const root = shallowRender({ addon: fakeAddon, dispatch: fakeDispatch });
    fakeDispatch.reset();
    // Update with the same addon (this apparently happens in real usage).
    root.setProps({ addon: fakeAddon });
    // The view context should not be dispatched.
    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not update view context unless there is an addon', () => {
    const fakeDispatch = sinon.stub();
    const root = shallowRender({ dispatch: fakeDispatch });
    fakeDispatch.reset();
    root.setProps({});
    sinon.assert.notCalled(fakeDispatch);
  });

  it('renders a name', () => {
    const root = shallowRender();
    expect(root.find('h1').html()).toContain('Chill Out');
  });

  it('renders without an add-on', () => {
    const errorHandler = createStubErrorHandler();
    const slugParam = 'some-addon'; // as passed through the URL.
    const fakeDispatch = sinon.stub();

    // Simulate the case when an add-on has not been loaded into state yet.
    const root = shallowRender({
      addon: null,
      errorHandler,
      dispatch: fakeDispatch,
      params: { slug: slugParam },
    });

    // Since there's no add-on, it should be fetched on load.
    sinon.assert.calledWith(
      fakeDispatch, fetchAddonAction({ errorHandler, slug: slugParam }));

    // These should be empty:
    expect(root.find(InstallButton)).toHaveLength(0);
    expect(root.find(AddonCompatibilityError)).toHaveLength(0);
    expect(root.find(AddonMoreInfo)).toHaveLength(0);
    expect(root.find(RatingManager)).toHaveLength(0);

    // These should show LoadingText
    expect(root.find('.AddonDescription-contents').find(LoadingText))
      .toHaveLength(1);
    expect(root.find('.Addon-summary').find(LoadingText)).toHaveLength(1);
    expect(root.find('.Addon-title').find(LoadingText)).toHaveLength(1);
    expect(root.find('.Addon-overall-rating').shallow().find(LoadingText))
      .toHaveLength(1);

    // These should render with an empty addon.
    expect(root.find(AddonMeta).prop('addon')).toEqual(null);
  });

  it('does not dispatch fetchAddon action when slug is the same', () => {
    const fakeDispatch = sinon.stub();
    const errorHandler = createStubErrorHandler();
    const addon = fakeAddon;
    const root = shallowRender({ addon, errorHandler, dispatch: fakeDispatch });

    fakeDispatch.reset();
    // Update with the same slug.
    root.setProps({ params: { slug: addon.slug } });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches fetchAddon action when updating with a new slug', () => {
    const fakeDispatch = sinon.stub();
    const errorHandler = createStubErrorHandler();
    const root = shallowRender({ errorHandler, dispatch: fakeDispatch });
    const slug = 'some-new-slug';

    fakeDispatch.reset();
    // Update with a new slug.
    root.setProps({ params: { slug } });

    sinon.assert.calledWith(fakeDispatch, fetchAddonAction({ errorHandler, slug }));
  });

  it('renders an error if there is one', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));

    const root = shallowRender({ errorHandler });
    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('renders 404 page for missing add-on', () => {
    const id = 'error-handler-id';
    const { store } = createStore();

    const error = createApiError({
      response: { status: 404 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'Not found' },
    });
    store.dispatch(setError({ id, error }));
    const capturedError = store.getState().errors[id];
    expect(capturedError).toBeTruthy();

    // Set up an error handler from state like withErrorHandler().
    const errorHandler = new ErrorHandler({
      id, dispatch: sinon.stub(), capturedError,
    });

    const root = shallowRender({ errorHandler });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders a single author', () => {
    const authorUrl = 'http://olympia.dev/en-US/firefox/user/krupa/';
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        authors: [{
          name: 'Krupa',
          url: authorUrl,
        }],
      },
    });
    expect(root.find('.Addon-title').html()).toContain('Krupa');
    expect(root.find('.Addon-title').html()).toContain(authorUrl);
  });

  it('renders multiple authors', () => {
    const root = shallowRender({
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
    expect(root.find('h1').html()).toContain('Krupa');
    expect(root.find('h1').html()).toContain('Fligtar');
  });

  it('sanitizes a title', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        name: '<script>alert(document.cookie);</script>',
      },
    });
    // Make sure an actual script tag was not created.
    expect(root.find('h1 script')).toHaveLength(0);
    // Make sure the script removed.
    expect(root.find('h1').html()).not.toContain('<script>');
  });

  it('sanitizes a summary', () => {
    const scriptHTML = '<script>alert(document.cookie);</script>';
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        summary: scriptHTML,
      },
    });
    // Make sure an actual script tag was not created.
    expect(root.find('.Addon-summary script')).toHaveLength(0);
    // Make sure the script has been removed.
    expect(root.find('.Addon-summary').html()).not.toContain('<script>');
  });

  it('sanitizes bad description HTML', () => {
    const scriptHTML = '<script>alert(document.cookie);</script>';
    const root = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        description: scriptHTML,
      },
    });
    // Make sure an actual script tag was not created.
    expect(root.querySelector('.AddonDescription script')).toEqual(null);
    // Make sure the script has been removed.
    expect(root.querySelector('.AddonDescription').innerHTML)
      .not.toContain('<script>');
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
    const root = shallowRender().find(InstallButton);
    expect(root.prop('slug')).toEqual(fakeAddon.slug);
  });

  it('sets the type in the header', () => {
    const root = shallowRender();
    expect(root.find('.AddonDescription').prop('header'))
      .toContain('About this extension');
  });

  it('uses the summary as the description if no description exists', () => {
    const addon = { ...fakeAddon, summary: 'short text' };
    delete addon.description;
    const rootNode = renderAsDOMNode({ addon });
    expect(rootNode.querySelector('.AddonDescription-contents').textContent)
      .toEqual(addon.summary);
  });

  it('uses the summary as the description if description is blank', () => {
    const addon = { ...fakeAddon, description: '', summary: 'short text' };
    const rootNode = renderAsDOMNode({ addon });
    expect(rootNode.querySelector('.AddonDescription-contents').textContent).toEqual(addon.summary);
  });

  it('hides the description if description and summary are null', () => {
    const addon = { ...fakeAddon, description: null, summary: null };
    const rootNode = renderAsDOMNode({ addon });
    expect(rootNode.querySelector('.AddonDescription')).toEqual(null);
  });

  it('hides the description if description and summary are blank', () => {
    const addon = { ...fakeAddon, description: '', summary: '' };
    const rootNode = renderAsDOMNode({ addon });
    expect(rootNode.querySelector('.AddonDescription')).toEqual(null);
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

  it('allows some HTML tags in the description', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        description: '<b>super</b> <i>cool</i> <blink>add-on</blink>',
      },
    });
    const contents = root.find('.AddonDescription-contents');
    expect(contents.html()).toMatch(
      new RegExp('<b>super</b> <i>cool</i> add-on')
    );
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
    const root = shallowRender({ location }).find(RatingManagerWithI18n);
    expect(root.prop('addon')).toEqual(fakeAddon);
    expect(root.prop('location')).toEqual(location);
  });

  it('renders a summary', () => {
    const root = shallowRender();
    expect(root.find('.Addon-summary').html()).toContain(fakeAddon.summary);
  });

  it('renders a summary with links', () => {
    const rootNode = renderAsDOMNode({
      addon: {
        ...fakeAddon,
        summary: '<a href="http://foo.com/">my website</a>',
      },
    });
    expect(rootNode.querySelector('.Addon-summary').textContent).toContain('my website');
    expect(rootNode.querySelectorAll('.Addon-summary a').length).toEqual(1);
    expect(rootNode.querySelector('.Addon-summary a').href).toEqual('http://foo.com/');
  });

  it('renders an amo CDN icon image', () => {
    const iconURL = 'https://addons.cdn.mozilla.net/foo.jpg';
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        icon_url: iconURL,
      },
    });
    const src = root.find('.Addon-icon img').prop('src');
    expect(src).toEqual(iconURL);
  });

  it('renders a fall-back asset', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        icon_url: 'http://foo.com/whatever.jpg',
      },
    });
    const src = root.find('.Addon-icon img').prop('src');
    expect(src).toEqual('default-64.png');
  });

  it('renders a theme preview as an img', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
      },
    });
    const image = root.find('.Addon-theme-header-image');
    expect(image.type()).toEqual('img');
    expect(image).toHaveClassName('Addon-theme-header-image');
    expect(image.prop('src')).toEqual('https://amo/preview.png');
    expect(image.prop('alt')).toEqual('Tap to preview');
  });

  it('enables a theme preview for supported clients', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
    });
    const button = root.find('.Addon-theme-header-label');
    expect(button.prop('disabled')).toEqual(false);
  });

  it('disables install switch for unsupported clients', () => {
    const root = shallowRender({
      getClientCompatibility: getClientCompatibilityFalse,
    });
    expect(root.find(InstallButton).prop('disabled')).toBe(true);
  });

  it('passes installStatus to installButton, not add-on status', () => {
    const root = shallowRender({ addon: fakeAddon, installStatus: UNKNOWN });

    const button = root.find(InstallButton);
    expect(button.prop('status')).not.toEqual(fakeAddon.status);
    expect(button.prop('status')).toEqual(UNKNOWN);
  });

  it('enables a theme preview for non-enabled add-ons', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      installStatus: UNKNOWN,
    });
    expect(root.find('.Addon-theme-header-label')).toHaveLength(1);
  });

  it('disables theme preview for enabled add-ons', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      installStatus: ENABLED,
    });
    expect(root.find('.Addon-theme-header-label')).toHaveLength(0);
  });

  it('disables a theme preview for unsupported clients', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      getClientCompatibility: getClientCompatibilityFalse,
    });
    const button = root.find('.Addon-theme-header-label');
    expect(button.prop('disabled')).toEqual(true);
  });

  it('unsets the theme preview on component unmount', () => {
    const resetThemePreview = sinon.spy();
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
        isPreviewingTheme: true,
        themePreviewNode: 'theme-preview-node',
        resetThemePreview,
      },
    });
    root.unmount();
    expect(resetThemePreview.calledWith('theme-preview-node')).toBeTruthy();
  });

  it('sets the browsertheme data on the header', () => {
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        previewURL: 'https://amo/preview.png',
      },
      getBrowserThemeData: () => '{"the":"themedata"}',
    });
    const header = root.find('.Addon-theme-header');
    expect(header.prop('data-browsertheme')).toEqual('{"the":"themedata"}');
  });

  it('toggles a theme on click', () => {
    const toggleThemePreview = sinon.spy();
    const root = shallowRender({
      addon: {
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
      },
      toggleThemePreview,
    });
    const header = root.find('.Addon-theme-header');
    const currentTarget = sinon.stub();
    header.simulate('click', { currentTarget });
    sinon.assert.calledWith(toggleThemePreview, currentTarget);
  });

  it('renders an AddonMoreInfo component when there is an add-on', () => {
    const root = shallowRender({ addon: fakeAddon });
    expect(root.find(AddonMoreInfo)).toHaveLength(1);
  });

  it('renders meta data for the add-on', () => {
    const root = shallowRender({ addon: fakeAddon });
    expect(root.find(AddonMeta).prop('addon')).toEqual(fakeAddon);
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
        root.querySelector('.Addon-read-reviews-footer');
      expect(footer.textContent).toEqual('No reviews yet');
      expect(root.querySelector('footer').className).toEqual('Card-footer-text');
    });

    it('prompts you to read one review', () => {
      const root = reviewFooterDOM({
        ratingsCount: 1,
      });
      const footer =
        root.querySelector('.Addon-read-reviews-footer');
      expect(footer.textContent).toEqual('Read 1 review');
      expect(root.querySelector('footer').className).toEqual('Card-footer-link');
    });

    it('prompts you to read many reviews', () => {
      const root = reviewFooterDOM({
        ratingsCount: 5,
      });
      const footer =
        root.querySelector('.Addon-read-reviews-footer');
      expect(footer.textContent).toEqual('Read all 5 reviews');
    });

    it('localizes the review count', () => {
      const root = reviewFooterDOM({
        ratingsCount: 10000,
      });
      const footer =
        root.querySelector('.Addon-read-reviews-footer');
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
          component.props.className === 'Addon-all-reviews-link');
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

  describe('version release notes', () => {
    function addonWithVersion(version = {}) {
      return {
        ...fakeAddon,
        current_version: version && {
          ...fakeAddon.current_version,
          version: '2.5.0',
          release_notes: 'Changed some stuff',
          ...version,
        },
      };
    }

    function getReleaseNotes(...args) {
      const root = shallowRender({
        addon: addonWithVersion(...args),
      });
      return root.find('.AddonDescription-version-notes p').render();
    }

    it('is hidden when an add-on has not loaded yet', () => {
      const root = shallowRender({ addon: undefined });
      expect(root.find('.AddonDescription-version-notes p'))
        .toHaveLength(0);
    });

    it('is hidden when the add-on does not have a current version', () => {
      const root = shallowRender({ addon: addonWithVersion(null) });
      expect(root.find('.AddonDescription-version-notes p'))
        .toHaveLength(0);
    });

    it('is hidden when the current version does not have release notes', () => {
      const root = shallowRender({
        addon: addonWithVersion({ release_notes: null }),
      });
      expect(root.find('.AddonDescription-version-notes p'))
        .toHaveLength(0);
    });

    it('shows the version string', () => {
      const root = shallowRender({
        addon: addonWithVersion({
          version: 'v1.4.5',
        }),
      });
      const card = root.find('.AddonDescription-version-notes');
      expect(card.prop('header')).toEqual('Release notes for v1.4.5');
    });

    it('shows the release notes', () => {
      const root = shallowRender({
        addon: addonWithVersion({
          release_notes: 'Fixed some stuff',
        }),
      });
      const notes = root.find('.AddonDescription-version-notes p');
      expect(notes.html()).toContain('Fixed some stuff');
    });

    it('allows some HTML tags', () => {
      const root = getReleaseNotes({
        release_notes: '<b>lots</b> <i>of</i> <blink>bug fixes</blink>',
      });
      expect(root.html()).toMatch(
        new RegExp('<b>lots</b> <i>of</i> bug fixes')
      );
    });
  });
});

describe('mapStateToProps', () => {
  let store;

  beforeEach(() => {
    store = createStore().store;
  });

  function signIn(params) {
    dispatchSignInActions({ store, ...params });
  }

  function fetchAddon({ addon = fakeAddon } = {}) {
    store.dispatch(loadAddons(createFetchAddonResult(addon).entities));
  }

  function _mapStateToProps(
    state = store.getState(),
    ownProps = { params: { slug: fakeAddon.slug } },
  ) {
    return mapStateToProps(state, ownProps);
  }

  it('can handle a missing addon', () => {
    signIn();
    const { addon } = _mapStateToProps();
    expect(addon).toBeFalsy();
  });

  it('sets the clientApp and userAgent', () => {
    const clientAppFromAgent = 'firefox';
    signIn({ clientApp: clientAppFromAgent });
    fetchAddon();
    const { clientApp, userAgentInfo } = _mapStateToProps();

    expect(clientApp).toEqual(clientAppFromAgent);
    const { browser, os } = sampleUserAgentParsed;
    expect(userAgentInfo).toEqual({ browser, os });
  });

  it('sets installStatus to INSTALLED when add-on is installed', () => {
    signIn();
    fetchAddon();
    store.dispatch(setInstallState({
      guid: fakeAddon.guid, needsRestart: false, status: INSTALLED,
    }));
    const { installStatus } = _mapStateToProps();

    expect(installStatus).toEqual(INSTALLED);
  });

  it('sets installStatus to UNKNOWN when add-on is not installed', () => {
    signIn();
    fetchAddon();
    const { installStatus } = _mapStateToProps();

    expect(installStatus).toEqual(UNKNOWN);
  });

  it('must convert all addon props to component props', () => {
    signIn();
    const description = 'whatever';
    fetchAddon({ addon: { ...fakeAddon, description } });
    const props = _mapStateToProps();

    // Make sure a random addon prop gets passed as a component prop
    // so that the withInstallHelpers HOC works.
    expect(props.description).toEqual(description);
  });

  it('must convert all installed addon props to component props', () => {
    signIn();
    fetchAddon();
    store.dispatch(setInstallState({
      guid: fakeAddon.guid, needsRestart: false, status: INSTALLED,
    }));
    const { needsRestart } = _mapStateToProps();

    // Make sure a random installedAddon prop gets passed as a component prop
    // so that the withInstallHelpers HOC works.
    expect(needsRestart).toEqual(false);
  });

  it('handles a non-existant add-on', () => {
    signIn();
    const { addon } = _mapStateToProps();

    expect(addon).toEqual(undefined);
  });

  it('displays a badge when the addon is featured', () => {
    const addon = { ...fakeAddon, is_featured: true };
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'featured');
    expect(root.find(Badge)).toHaveProp('label', 'Featured Extension');
  });

  it('adds a different badge label when a "theme" addon is featured', () => {
    const addon = { ...fakeAddon, is_featured: true, type: ADDON_TYPE_THEME };
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'featured');
    expect(root.find(Badge)).toHaveProp('label', 'Featured Theme');
  });

  it('adds a different badge label when an addon of a different type is featured', () => {
    const addon = { ...fakeAddon, is_featured: true, type: ADDON_TYPE_OPENSEARCH };
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'featured');
    expect(root.find(Badge)).toHaveProp('label', 'Featured Add-on');
  });

  it('does not display the featured badge when addon is not featured', () => {
    const addon = { ...fakeAddon, is_featured: false };
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveLength(0);
  });

  it('displays a badge when the addon needs restart', () => {
    const addon = { ...fakeAddon, isRestartRequired: true };
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveProp('type', 'restart-required');
    expect(root.find(Badge)).toHaveProp('label', 'Restart Required');
  });

  it('does not display the "restart required" badge when addon does not need restart', () => {
    const addon = { ...fakeAddon, isRestartRequired: false };
    const root = shallowRender({ addon });

    expect(root.find(Badge)).toHaveLength(0);
  });

  it('does not display the "restart required" badge when isRestartRequired is not true', () => {
    const root = shallowRender({ addon: fakeAddon });

    expect(root.find(Badge)).toHaveLength(0);
  });
});
