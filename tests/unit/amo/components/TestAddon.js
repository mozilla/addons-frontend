import { shallow } from 'enzyme';
import { createMemoryHistory } from 'history';
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  scryRenderedComponentsWithType,
} from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';

import { setViewContext } from 'amo/actions/viewContext';
import Addon, {
  AddonBase,
  extractId,
  mapStateToProps,
} from 'amo/components/Addon';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import AddonRecommendations from 'amo/components/AddonRecommendations';
import ContributeCard from 'amo/components/ContributeCard';
import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import PermissionsCard from 'amo/components/PermissionsCard';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import RatingManager, {
  RatingManagerWithI18n,
} from 'amo/components/RatingManager';
import createStore from 'amo/store';
import {
  createInternalAddon,
  fetchAddon as fetchAddonAction,
  loadAddons,
} from 'core/reducers/addons';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { setError } from 'core/actions/errors';
import { setInstallState } from 'core/actions/installations';
import { createApiError } from 'core/api/index';
import {
  ADDON_TYPE_COMPLETE_THEME,
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_FIREFOX,
  INCOMPATIBLE_NOT_FIREFOX,
  INCOMPATIBLE_UNDER_MIN_VERSION,
  INSTALL_SOURCE_DETAIL_PAGE,
  INSTALLED,
  UNKNOWN,
} from 'core/constants';
import InstallButton from 'core/components/InstallButton';
import { ErrorHandler } from 'core/errorHandler';
import I18nProvider from 'core/i18n/Provider';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import { addQueryParamsToHistory } from 'core/utils';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeInstalledAddon,
  fakePreview,
  fakeTheme,
} from 'tests/unit/amo/helpers';
import {
  createFetchAddonResult,
  createStubErrorHandler,
  fakeI18n,
  fakeRouterLocation,
  getFakeConfig,
  sampleUserAgentParsed,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import Button from 'ui/components/Button';

function renderProps({
  addon = createInternalAddon(fakeAddon),
  params,
  setCurrentStatus = sinon.spy(),
  ...customProps
} = {}) {
  const i18n = fakeI18n();
  const addonProps = addon || {};
  return {
    addon,
    ...addonProps,
    dispatch: sinon.stub(),
    errorHandler: createStubErrorHandler(),
    getClientCompatibility: () => ({ compatible: true, reason: null }),
    i18n,
    location: fakeRouterLocation(),
    match: {
      params: params || { slug: addon ? addon.slug : fakeAddon.slug },
    },
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

  const history = addQueryParamsToHistory({
    history: createMemoryHistory(),
  });

  return findRenderedComponentWithType(
    renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={i18n}>
          <Router history={history}>
            <AddonBase store={store} {...props} />
          </Router>
        </I18nProvider>
      </Provider>,
    ),
    AddonBase,
  );
}

function renderAsDOMNode(...args) {
  const root = render(...args);
  return findDOMNode(root);
}

function renderComponent(...args) {
  const props = renderProps(...args);
  return shallowUntilTarget(<Addon {...props} />, AddonBase);
}

function shallowRender(...args) {
  const props = renderProps(...args);
  return shallow(<AddonBase {...props} />, { context: { i18n: props.i18n } });
}

describe(__filename, () => {
  const incompatibleClientResult = {
    compatible: false,
    maxVersion: null,
    minVersion: null,
    reason: INCOMPATIBLE_NOT_FIREFOX,
  };

  const getClientCompatibilityFalse = () => incompatibleClientResult;

  const _loadAddons = ({ addon = fakeAddon }) => {
    return loadAddons(createFetchAddonResult(addon).entities);
  };

  const _loadAddonsByAuthors = ({ addon, addonsByAuthors }) => {
    return loadAddonsByAuthors({
      addons: addonsByAuthors,
      authorUsernames: ['foo'],
      count: addonsByAuthors.length,
      forAddonSlug: addon.slug,
      pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
    });
  };

  it('dispatches setViewContext with addonType', () => {
    const fakeDispatch = sinon.stub();
    shallowRender({ dispatch: fakeDispatch });

    sinon.assert.calledWith(fakeDispatch, setViewContext(fakeAddon.type));
  });

  it('dispatches setViewContext on update', () => {
    const fakeDispatch = sinon.stub();
    const root = shallowRender({ dispatch: fakeDispatch });
    fakeDispatch.resetHistory();
    root.setProps({
      addon: createInternalAddon({ ...fakeAddon, type: ADDON_TYPE_THEME }),
    });

    sinon.assert.calledWith(fakeDispatch, setViewContext(ADDON_TYPE_THEME));
  });

  it('dispatches setViewContext when updating with new addon', () => {
    const fakeDispatch = sinon.stub();
    // Start with a null addon
    const root = shallowRender({
      addon: null,
      dispatch: fakeDispatch,
      params: { slug: 'some-slug' },
    });
    fakeDispatch.resetHistory();
    // Update with a new addon
    root.setProps({ addon: createInternalAddon(fakeAddon) });

    sinon.assert.calledWith(fakeDispatch, setViewContext(fakeAddon.type));
  });

  it('only dispatches setViewContext for a new addon type', () => {
    const fakeDispatch = sinon.stub();
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon, dispatch: fakeDispatch });
    fakeDispatch.resetHistory();
    // Update with the same addon (this apparently happens in real usage).
    root.setProps({ addon });
    // The view context should not be dispatched.
    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not update view context unless there is an addon', () => {
    const fakeDispatch = sinon.stub();
    const root = shallowRender({ dispatch: fakeDispatch });
    fakeDispatch.resetHistory();
    root.setProps({});
    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any new actions if error handler has an error', () => {
    const id = 'error-handler-id';
    const { store } = dispatchClientMetadata();

    const error = createApiError({
      response: { status: 400 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'Bad request' },
    });

    store.dispatch(setError({ id, error }));
    const capturedError = store.getState().errors[id];
    // This makes sure the error was dispatched to state correctly.
    expect(capturedError).toBeTruthy();

    const fakeDispatch = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler(capturedError);

    renderComponent({ store, errorHandler });

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
      fakeDispatch,
      fetchAddonAction({ errorHandler, slug: slugParam }),
    );

    // These should be empty:
    expect(root.find(InstallButton)).toHaveLength(0);
    expect(root.find(AddonCompatibilityError)).toHaveLength(0);
    expect(root.find(RatingManager)).toHaveLength(0);

    // These should show LoadingText
    expect(root.find('.AddonDescription').prop('header')).toEqual(
      <LoadingText minWidth={20} range={60} width={40} />,
    );
    expect(
      root.find('.AddonDescription-contents').find(LoadingText),
    ).toHaveLength(1);
    expect(root.find('.Addon-summary').find(LoadingText)).toHaveLength(1);
    expect(root.find('.Addon-title').find(LoadingText)).toHaveLength(1);
    expect(
      root
        .find('.Addon-overall-rating')
        .shallow()
        .find(LoadingText),
    ).toHaveLength(1);

    // These should render with an empty addon (they will show their own
    // loading state).
    expect(root.find(AddonMeta)).toHaveProp('addon', null);
    expect(root.find(AddonMoreInfo)).toHaveProp('addon', null);
    expect(root.find(AddonMoreInfo)).toHaveLength(1);

    // Since withInstallHelpers relies on this, make sure it's initialized.
    expect(root.instance().props.platformFiles).toEqual({});
  });

  it('does not dispatch fetchAddon action when slug is the same', () => {
    const fakeDispatch = sinon.stub();
    const errorHandler = createStubErrorHandler();
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon, errorHandler, dispatch: fakeDispatch });

    fakeDispatch.resetHistory();
    // Update with the same slug.
    root.setProps({ params: { slug: addon.slug } });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches fetchAddon action when updating with a new slug', () => {
    const fakeDispatch = sinon.stub();
    const errorHandler = createStubErrorHandler();
    const root = shallowRender({ errorHandler, dispatch: fakeDispatch });
    const slug = 'some-new-slug';

    fakeDispatch.resetHistory();
    // Update with a new slug.
    root.setProps({ match: { params: { slug } } });

    sinon.assert.calledWith(
      fakeDispatch,
      fetchAddonAction({
        errorHandler,
        slug,
      }),
    );
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
      id,
      dispatch: sinon.stub(),
      capturedError,
    });

    const root = shallowRender({ errorHandler });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders NotFound page for unauthorized add-on - 401 error', () => {
    const { store } = dispatchClientMetadata();

    const error = createApiError({
      response: { status: 401 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: {
        message: 'Authentication credentials were not provided.',
      },
    });
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(error);

    const root = renderComponent({ errorHandler, store });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders NotFound page for forbidden add-on - 403 error', () => {
    const { store } = dispatchClientMetadata();

    const error = createApiError({
      response: { status: 403 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { message: 'You do not have permission.' },
    });
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(error);

    const root = renderComponent({ errorHandler, store });
    expect(root.find(NotFound)).toHaveLength(1);
  });

  it('renders NotFound with a custom error code', () => {
    const errorCode = 'CUSTOM_ERROR_CODE';
    const { store } = dispatchClientMetadata();

    const error = createApiError({
      response: { status: 403 },
      apiURL: 'https://some/api/endpoint',
      jsonResponse: { code: errorCode, message: 'Some error' },
    });
    const errorHandler = new ErrorHandler({
      id: 'some-id',
      dispatch: store.dispatch,
    });
    errorHandler.handle(error);

    const root = renderComponent({ errorHandler, store });
    expect(root.find(NotFound)).toHaveProp('errorCode', errorCode);
  });

  it('renders a single author', () => {
    const authorUrl = 'http://olympia.test/en-US/firefox/user/krupa/';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        authors: [
          {
            name: 'Krupa',
            url: authorUrl,
          },
        ],
      }),
    });
    expect(root.find('.Addon-title').html()).toContain('Krupa');
    expect(root.find('.Addon-title').html()).toContain(authorUrl);
  });

  it('renders multiple authors', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        authors: [
          {
            name: 'Krupa',
            url: 'http://olympia.test/en-US/firefox/user/krupa/',
          },
          {
            name: 'Fligtar',
            url: 'http://olympia.test/en-US/firefox/user/fligtar/',
          },
        ],
      }),
    });
    expect(root.find('h1').html()).toContain('Krupa');
    expect(root.find('h1').html()).toContain('Fligtar');
  });

  it('renders an author without url', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        authors: [
          {
            name: 'Krupa',
            url: null,
          },
        ],
      }),
    });
    expect(root.find('.Addon-title').html()).toContain('Krupa');
    expect(
      root
        .find('.Addon-title')
        .render()
        .find('a'),
    ).toHaveLength(0);
  });

  it('dispatches a server redirect when slug is a numeric ID', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = createInternalAddon(fakeAddon);
    store.dispatch(_loadAddons({ addon }));

    const fakeDispatch = sinon.spy(store, 'dispatch');
    renderComponent({
      // We set the numeric `id` as slug.
      params: { slug: addon.id },
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}/addon/${addon.slug}/`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('dispatches a server redirect when slug is a stringified integer greater than 0', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = createInternalAddon(fakeAddon);
    store.dispatch(_loadAddons({ addon }));

    const fakeDispatch = sinon.spy(store, 'dispatch');
    renderComponent({
      // We set the numeric `id` as slug, casted as a string.
      params: { slug: `${addon.id}` },
      store,
    });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}/addon/${addon.slug}/`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  // The reason for this test case came from https://github.com/mozilla/addons-frontend/issues/4541.
  it('does not dispatch a server redirect when slug is a stringified integer less than 0', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = createInternalAddon({
      ...fakeAddon,
      slug: '-1234',
    });

    store.dispatch(_loadAddons({ addon }));

    const fakeDispatch = sinon.spy(store, 'dispatch');
    renderComponent({
      params: { slug: addon.slug },
      store,
    });

    sinon.assert.calledWith(fakeDispatch, setViewContext(fakeAddon.type));
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('sanitizes a title', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        name: '<script>alert(document.cookie);</script>',
      }),
    });
    // Make sure an actual script tag was not created.
    expect(root.find('h1 script')).toHaveLength(0);
    // Make sure the script removed.
    expect(root.find('h1').html()).not.toContain('<script>');
  });

  it('sanitizes a summary', () => {
    const scriptHTML = '<script>alert(document.cookie);</script>';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        summary: scriptHTML,
      }),
    });
    // Make sure an actual script tag was not created.
    expect(root.find('.Addon-summary script')).toHaveLength(0);
    // Make sure the script has been removed.
    expect(root.find('.Addon-summary').html()).not.toContain('<script>');
  });

  it('adds <br> tags for newlines in a summary', () => {
    const summaryWithNewlines = 'Hello\nI am an add-on.';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        summary: summaryWithNewlines,
      }),
    });

    expect(
      root
        .find('.Addon-summary')
        .render()
        .find('br'),
    ).toHaveLength(1);
  });

  it('sanitizes bad description HTML', () => {
    const scriptHTML = '<script>alert(document.cookie);</script>';
    const root = renderAsDOMNode({
      addon: createInternalAddon({
        ...fakeAddon,
        description: scriptHTML,
      }),
    });
    // Make sure an actual script tag was not created.
    expect(root.querySelector('.AddonDescription script')).toEqual(null);
    // Make sure the script has been removed.
    expect(root.querySelector('.AddonDescription').innerHTML).not.toContain(
      '<script>',
    );
  });

  it('allows certain HTML tags in the title', () => {
    const rootNode = renderAsDOMNode({
      addon: createInternalAddon({
        ...fakeAddon,
        authors: [
          {
            name: 'Krupa',
            url: 'http://olympia.test/en-US/firefox/user/krupa/',
          },
        ],
      }),
    });
    // Make sure these tags were whitelisted.
    expect(rootNode.querySelector('h1 span a').textContent).toEqual('Krupa');
    // Make sure the santizer didn't strip the class attribute:
    const byline = rootNode.querySelector('h1 span');
    expect(byline.attributes.class).toBeTruthy();
  });

  it('configures the install button', () => {
    const root = shallowRender().find(InstallButton);
    expect(root.prop('slug')).toEqual(fakeAddon.slug);
  });

  it('always uses a button and not a switch for the InstallButton', () => {
    const root = shallowRender().find(InstallButton);
    expect(root.prop('useButton')).toEqual(true);
  });

  it('sets a title for the description of an extension', () => {
    const root = shallowRender();
    expect(root.find('.AddonDescription').prop('header')).toContain(
      'About this extension',
    );
  });

  it('sets a title for the description of a static theme', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
      }),
    });
    expect(root.find('.AddonDescription').prop('header')).toContain(
      'About this theme',
    );
  });

  it('sets a title for the description of a dictionary', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_DICT,
      }),
    });
    expect(root.find('.AddonDescription').prop('header')).toContain(
      'About this dictionary',
    );
  });

  it('sets a title for the description of a language pack', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_LANG,
      }),
    });
    expect(root.find('.AddonDescription').prop('header')).toContain(
      'About this language pack',
    );
  });

  it('sets a title for the description of a search plugin', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_OPENSEARCH,
      }),
    });
    expect(root.find('.AddonDescription').prop('header')).toContain(
      'About this search plugin',
    );
  });

  it('sets a title for the description of a generic add-on', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_COMPLETE_THEME,
      }),
    });
    expect(root.find('.AddonDescription').prop('header')).toContain(
      'About this add-on',
    );
  });

  it('hides the description if description and summary are null', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      description: null,
      summary: null,
    });
    const rootNode = renderAsDOMNode({ addon });
    expect(rootNode.querySelector('.AddonDescription')).toEqual(null);
  });

  it('hides the description if description and summary are blank', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      description: '',
      summary: '',
    });
    const rootNode = renderAsDOMNode({ addon });
    expect(rootNode.querySelector('.AddonDescription')).toEqual(null);
  });

  it("does not display a lightweight theme's summary", () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_THEME,
        summary: 'my theme is very cool',
      }),
    });

    expect(root.find('.AddonDescription')).toHaveLength(0);
  });

  it("displays a static theme's description", () => {
    const description = 'some cool description';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
        summary: 'my theme is very cool',
        description,
      }),
    });

    expect(root.find('.AddonDescription')).toHaveLength(1);

    expect(root.find('.AddonDescription-contents')).toHaveHTML(
      `<div class="AddonDescription-contents">${description}</div>`,
    );
  });

  it('does not display anything if a static theme has no description', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
        summary: 'my theme is very cool',
        description: null,
      }),
    });

    expect(root.find('.AddonDescription')).toHaveLength(0);
  });

  it("displays the extension's summary when there is no description", () => {
    const summary = 'my theme is very cool';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_EXTENSION,
        summary,
        description: null,
      }),
    });

    expect(root.find('.AddonDescription')).toHaveLength(1);

    expect(root.find('.AddonDescription-contents')).toHaveHTML(
      `<div class="AddonDescription-contents">${summary}</div>`,
    );
  });

  it("displays the extension's description when both description and summary are supplied", () => {
    const description = 'some cool description';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_EXTENSION,
        summary: 'my theme is very cool',
        description,
      }),
    });

    expect(root.find('.AddonDescription')).toHaveLength(1);

    expect(root.find('.AddonDescription-contents')).toHaveHTML(
      `<div class="AddonDescription-contents">${description}</div>`,
    );
  });

  it('converts new lines in the description to breaks', () => {
    const rootNode = renderAsDOMNode({
      addon: createInternalAddon({
        ...fakeAddon,
        description: '\n\n\n',
      }),
    });
    expect(rootNode.querySelectorAll('.AddonDescription br').length).toBe(3);
  });

  it('allows some HTML tags in the description', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        description: '<b>super</b> <i>cool</i> <blink>add-on</blink>',
      }),
    });
    const contents = root.find('.AddonDescription-contents');
    expect(contents.html()).toMatch(
      new RegExp('<b>super</b> <i>cool</i> add-on'),
    );
  });

  it('strips dangerous HTML tag attributes from description', () => {
    const rootNode = renderAsDOMNode({
      addon: createInternalAddon({
        ...fakeAddon,
        description:
          '<a href="javascript:alert(document.cookie)" onclick="sneaky()">placeholder</a>',
      }),
    });
    const anchor = rootNode.querySelector('.AddonDescription a');
    expect(anchor.getAttribute('onclick')).toEqual(null);
    expect(anchor.getAttribute('href')).toEqual(null);
  });

  it('configures the overall ratings section', () => {
    const location = fakeRouterLocation();
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon, location }).find(RatingManagerWithI18n);
    expect(root.prop('addon')).toEqual(addon);
    expect(root.prop('location')).toEqual(location);
  });

  it('does not show a ratings manager without a version', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      current_version: null,
    });
    const root = shallowRender({ addon });

    expect(root.find(RatingManagerWithI18n)).toHaveLength(0);
    expect(root.find('.Addon-no-rating-manager')).toHaveLength(1);
  });

  it('renders a summary', () => {
    const root = shallowRender();
    expect(root.find('.Addon-summary').html()).toContain(fakeAddon.summary);
  });

  it('renders a summary with links', () => {
    const rootNode = renderAsDOMNode({
      addon: createInternalAddon({
        ...fakeAddon,
        summary: '<a href="http://foo.com/">my website</a>',
      }),
    });
    expect(rootNode.querySelector('.Addon-summary').textContent).toContain(
      'my website',
    );
    expect(rootNode.querySelectorAll('.Addon-summary a').length).toEqual(1);
    expect(rootNode.querySelector('.Addon-summary a').href).toEqual(
      'http://foo.com/',
    );
  });

  it('renders an amo CDN icon image', () => {
    const iconURL = 'https://addons.cdn.mozilla.net/foo.jpg';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        icon_url: iconURL,
      }),
    });
    const src = root.find('.Addon-icon img').prop('src');
    expect(src).toEqual(iconURL);
  });

  it('renders a fall-back asset', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        icon_url: 'http://foo.com/whatever.jpg',
      }),
    });
    const src = root.find('.Addon-icon img').prop('src');
    expect(src).toEqual('default-64.png');
  });

  it('renders a lightweight theme preview as an image', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        // The 'previews' field is not currently being used by lightweight themes
        // So here we are just overridding the fakeAddon values to mimic the API
        // response.
        previews: [],
        theme_data: {
          ...fakeTheme.theme_data,
          previewURL: 'https://amo/preview.png',
        },
      }),
    });
    const image = root.find('.Addon-theme-header-image');
    expect(image.type()).toEqual('img');
    expect(image.prop('src')).toEqual('https://amo/preview.png');
  });

  it('renders a static theme preview as an image', () => {
    const headerImageFull = 'https://addons.cdn.mozilla.net/full/54321.png';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_STATIC_THEME,
        previews: [
          {
            ...fakePreview,
            image_url: headerImageFull,
          },
        ],
      }),
    });
    const image = root.find('.Addon-theme-header-image');
    expect(image.type()).toEqual('img');
    expect(image.prop('src')).toEqual(headerImageFull);
    expect(image.prop('alt')).toEqual('Preview of Dancing Daisies by MaDonna');
  });

  it('renders the preview image from the previews array if it exists for the lightweight theme', () => {
    const headerImageFull = 'https://addons.cdn.mozilla.net/full/12345.png';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_THEME,
        previews: [
          {
            ...fakePreview,
            image_url: headerImageFull,
          },
        ],
      }),
    });
    const image = root.find('.Addon-theme-header-image');
    expect(image.type()).toEqual('img');
    expect(image.prop('src')).toEqual(headerImageFull);
    expect(image.prop('alt')).toEqual('Preview of Dancing Daisies by MaDonna');
  });

  it('renders screenshots for type extension', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_EXTENSION,
      }),
    });
    expect(root.find('.Addon-screenshots')).toHaveLength(1);
  });

  it('hides screenshots for lightweight theme type', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_THEME,
      }),
    });
    expect(root.find('.Addon-screenshots')).toHaveLength(0);
  });

  it('hides screenshots for static theme type', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_STATIC_THEME,
      }),
    });
    expect(root.find('.Addon-screenshots')).toHaveLength(0);
  });

  it('uses Addon-theme class if it is a lightweight theme', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_THEME,
      }),
    });
    expect(root.find('.Addon-theme')).toHaveLength(1);
  });

  it('uses Addon-theme class if it is a static theme', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_STATIC_THEME,
      }),
    });
    expect(root.find('.Addon-theme')).toHaveLength(1);
  });

  it('disables install button for incompatibility with firefox version', () => {
    const root = shallowRender({
      getClientCompatibility: () => ({
        reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      }),
    });
    expect(root.find(InstallButton).prop('disabled')).toBe(true);
  });

  it('passes the downloadUrl from getClientCompatibility', () => {
    const root = shallowRender({
      getClientCompatibility: () => ({
        compatible: false,
        downloadUrl: 'https://www.seamonkey-project.org',
        reason: INCOMPATIBLE_UNDER_MIN_VERSION,
      }),
    });
    expect(root.find(AddonCompatibilityError).prop('downloadUrl')).toEqual(
      'https://www.seamonkey-project.org',
    );
  });

  it('hides banner on non firefox clients and displays firefox download button', () => {
    const root = shallowRender({
      getClientCompatibility: getClientCompatibilityFalse,
    });
    expect(root.find(AddonCompatibilityError)).toHaveLength(0);
    expect(root.find(Button)).toHaveLength(1);
  });

  it('passes installStatus to installButton, not add-on status', () => {
    const root = shallowRender({
      addon: createInternalAddon(fakeAddon),
      installStatus: UNKNOWN,
    });

    const button = root.find(InstallButton);
    expect(button.prop('status')).not.toEqual(fakeAddon.status);
    expect(button.prop('status')).toEqual(UNKNOWN);
  });

  it('sets an install source', () => {
    const addon = fakeAddon;
    const { store } = dispatchClientMetadata();
    store.dispatch(_loadAddons({ addon }));
    const root = renderComponent({
      params: { slug: addon.slug },
      store,
    });

    const button = root.find(InstallButton);
    // This value is passed to <Addon/> by the withInstallHelpers() HOC.
    expect(button).toHaveProp(
      'defaultInstallSource',
      INSTALL_SOURCE_DETAIL_PAGE,
    );
  });

  it('shows the preview image in the header', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        theme_data: {
          ...fakeTheme.theme_data,
          previewURL: 'https://amo/preview.png',
        },
      }),
    });
    expect(root.find('.Addon-theme-header-image')).toHaveLength(1);
  });

  it('renders an AddonMoreInfo component when there is an add-on', () => {
    const root = shallowRender({ addon: createInternalAddon(fakeAddon) });
    expect(root.find(AddonMoreInfo)).toHaveLength(1);
  });

  it('renders meta data for the add-on', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon });
    expect(root.find(AddonMeta).prop('addon')).toEqual(addon);
  });

  it('renders permissions for the add-on', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon });
    expect(root.find(PermissionsCard)).toHaveProp('addon', addon);
  });

  it('renders permissions with no add-on', () => {
    const root = shallowRender({ addon: null });
    expect(root.find(PermissionsCard)).toHaveProp('addon', null);
  });

  it('renders recommendations for an extension', () => {
    const fakeConfig = getFakeConfig({ enableAddonRecommendations: true });
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon, config: fakeConfig });
    expect(root.find(AddonRecommendations)).toHaveLength(1);
    expect(root.find(AddonRecommendations)).toHaveProp('addon', addon);
  });

  it('renders recommendations for an extension with no loaded add-on', () => {
    const fakeConfig = getFakeConfig({ enableAddonRecommendations: true });
    const root = shallowRender({ addon: null, config: fakeConfig });
    expect(root.find(AddonRecommendations)).toHaveLength(1);
    expect(root.find(AddonRecommendations)).toHaveProp('addon', null);
  });

  it('does not render recommendations if the config flag is false', () => {
    const fakeConfig = getFakeConfig({ enableAddonRecommendations: false });
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon, config: fakeConfig });
    expect(root.find(AddonRecommendations)).toHaveLength(0);
  });

  it('does not render recommendations if the add-on is not an extension', () => {
    const fakeConfig = getFakeConfig({ enableAddonRecommendations: true });
    for (const addonType of [
      ADDON_TYPE_COMPLETE_THEME,
      ADDON_TYPE_DICT,
      ADDON_TYPE_LANG,
      ADDON_TYPE_OPENSEARCH,
      ADDON_TYPE_THEME,
    ]) {
      const addon = createInternalAddon({
        ...fakeAddon,
        type: addonType,
      });
      const root = shallowRender({ addon, config: fakeConfig });
      expect(root.find(AddonRecommendations)).toHaveLength(0);
    }
  });

  describe('read reviews footer', () => {
    function reviewFooterDOM({ ratingsCount = 1, ...customProps }) {
      return renderAsDOMNode({
        addon: createInternalAddon({
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            text_count: ratingsCount,
          },
        }),
        ...customProps,
      });
    }

    it('only links to reviews when they exist', () => {
      const root = reviewFooterDOM({
        ratingsCount: 0,
      });

      const footer = root.querySelector('.Addon-read-reviews-footer');
      expect(footer.textContent).toEqual('No reviews yet');
      expect(root.querySelector('footer').className).toEqual(
        'Card-footer Card-footer-text',
      );
    });

    it('prompts you to read one review', () => {
      const root = reviewFooterDOM({
        ratingsCount: 1,
      });

      const footer = root.querySelector('.Addon-read-reviews-footer');
      expect(footer.textContent).toEqual('Read 1 review');
      expect(root.querySelector('footer').className).toEqual(
        'Card-footer Card-footer-link',
      );
    });

    it('prompts you to read many reviews', () => {
      const root = reviewFooterDOM({
        ratingsCount: 5,
      });
      const footer = root.querySelector('.Addon-read-reviews-footer');
      expect(footer.textContent).toEqual('Read all 5 reviews');
    });

    it('localizes the review count', () => {
      const root = reviewFooterDOM({
        ratingsCount: 10000,
      });
      const footer = root.querySelector('.Addon-read-reviews-footer');
      expect(footer.textContent).toContain('10,000');
    });

    it('links to all reviews', () => {
      const root = render({
        addon: createInternalAddon({
          ...fakeAddon,
          ratings: {
            ...fakeAddon.ratings,
            text_count: 2,
          },
        }),
      });
      const allLinks = scryRenderedComponentsWithType(root, Link).filter(
        (component) => component.props.className === 'Addon-all-reviews-link',
      );
      expect(allLinks.length).toEqual(1);

      const link = allLinks[0];
      const path = link.props.to;
      expect(path).toEqual('/addon/chill-out/reviews/');
    });
  });

  describe('version release notes', () => {
    function addonWithVersion(version = {}) {
      return createInternalAddon({
        ...fakeAddon,
        current_version: version && {
          ...fakeAddon.current_version,
          version: '2.5.0',
          release_notes: 'Changed some stuff',
          ...version,
        },
      });
    }

    function getReleaseNotes(...args) {
      const root = shallowRender({
        addon: addonWithVersion(...args),
      });
      return root.find('.AddonDescription-version-notes div').render();
    }

    it('is hidden when an add-on has not loaded yet', () => {
      const root = shallowRender({ addon: undefined });
      expect(root.find('.AddonDescription-version-notes div')).toHaveLength(0);
    });

    it('is hidden when the add-on does not have a current version', () => {
      const root = shallowRender({ addon: addonWithVersion(null) });
      expect(root.find('.AddonDescription-version-notes div')).toHaveLength(0);
    });

    it('is hidden when the current version does not have release notes', () => {
      const root = shallowRender({
        addon: addonWithVersion({ release_notes: null }),
      });
      expect(root.find('.AddonDescription-version-notes div')).toHaveLength(0);
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
      const notes = root.find('.AddonDescription-version-notes div');
      expect(notes.html()).toContain('Fixed some stuff');
    });

    it('allows some HTML tags', () => {
      const root = getReleaseNotes({
        release_notes: '<b>lots</b> <i>of</i> <blink>bug fixes</blink>',
      });
      expect(root.html()).toMatch(
        new RegExp('<b>lots</b> <i>of</i> bug fixes'),
      );
    });

    it('allows some ul-li tags', () => {
      const root = getReleaseNotes({
        release_notes: '<b>The List</b><ul><li>one</li><li>two</li></ul>',
      });
      expect(root.html()).toMatch(
        new RegExp('<b>The List</b><ul><li>one</li><li>two</li></ul>'),
      );
    });
  });

  describe('more add-ons by authors', () => {
    const dispatchAddonData = ({ addon, addonsByAuthors }) => {
      const { store } = dispatchClientMetadata();

      store.dispatch(_loadAddons({ addon }));

      if (addonsByAuthors) {
        store.dispatch(_loadAddonsByAuthors({ addon, addonsByAuthors }));
      }

      return { store };
    };

    const renderMoreAddons = ({ addon, addonsByAuthors }) => {
      const { store } = dispatchAddonData({ addon, addonsByAuthors });
      const root = renderComponent({ params: { slug: addon.slug }, store });

      return root.find(AddonsByAuthorsCard);
    };

    it('puts "add-ons by author" in main content if type is theme', () => {
      const addon = fakeTheme;
      const { store } = dispatchAddonData({
        addon,
        addonsByAuthors: [{ ...fakeAddon, forAddonSlug: 'another-slug' }],
      });

      const root = renderComponent({ params: { slug: addon.slug }, store });

      expect(
        root.find('.Addon-main-content').find(AddonsByAuthorsCard),
      ).toHaveLength(1);
    });

    it('puts "add-ons by author" outside main if type is not theme', () => {
      const addon = fakeAddon;
      const { store } = dispatchAddonData({
        addon,
        addonsByAuthors: [{ ...fakeAddon, forAddonSlug: 'another-slug' }],
      });

      const root = renderComponent({ params: { slug: addon.slug }, store });

      expect(
        root.find('.Addon-main-content').find(AddonsByAuthorsCard),
      ).toHaveLength(0);
      expect(root.find(AddonsByAuthorsCard)).toHaveLength(1);
    });

    it('is hidden when an add-on has not loaded yet', () => {
      // We use shallowRender because we cannot dispatch a `undefined` add-on.
      const root = shallowRender({ addon: undefined });
      expect(root.find('.AddonDescription-more-addons')).toHaveLength(0);
    });

    it('is hidden when other addons are not loaded yet', () => {
      // We use shallowRender because we cannot dispatch a `undefined` add-on.
      const root = shallowRender({ addonsByAuthors: undefined });
      expect(root.find('.AddonDescription-more-addons')).toHaveLength(0);
    });

    it('is hidden when add-on has no authors', () => {
      const root = shallowRender({
        addon: createInternalAddon({
          ...fakeAddon,
          authors: [],
        }),
      });
      expect(root.find('.AddonDescription-more-addons')).toHaveLength(0);
    });

    it('displays more add-ons by authors', () => {
      const addon = createInternalAddon({ ...fakeAddon });
      const addonsByAuthors = [
        { ...fakeAddon, slug: 'addon-1', id: 1 },
        { ...fakeAddon, slug: 'addon-2', id: 2 },
        { ...fakeAddon, slug: 'addon-3', id: 3 },
        { ...fakeAddon, slug: 'addon-4', id: 4 },
        { ...fakeAddon, slug: 'addon-5', id: 5 },
        { ...fakeAddon, slug: 'addon-6', id: 6 },
      ];

      const root = renderMoreAddons({ addon, addonsByAuthors });

      expect(root).toHaveClassName('.Addon-MoreAddonsCard');
      expect(root).toHaveProp(
        'authorUsernames',
        addon.authors.map((author) => author.username),
      );
      expect(root).toHaveProp('addonType', addon.type);
      expect(root).toHaveProp('forAddonSlug', addon.slug);
      expect(root).toHaveProp('numberOfAddons', 6);
    });

    it('displays more add-ons by authors when add-on is a theme', () => {
      const addon = createInternalAddon({ ...fakeTheme });
      const addonsByAuthors = [
        { ...fakeTheme, slug: 'theme-1', id: 1 },
        { ...fakeTheme, slug: 'theme-2', id: 2 },
        { ...fakeTheme, slug: 'theme-3', id: 3 },
        { ...fakeTheme, slug: 'theme-4', id: 4 },
        { ...fakeTheme, slug: 'theme-5', id: 5 },
        { ...fakeTheme, slug: 'theme-6', id: 6 },
      ];

      const root = renderMoreAddons({ addon, addonsByAuthors });

      expect(root).toHaveClassName('.Addon-MoreAddonsCard');
      expect(root).toHaveProp(
        'authorUsernames',
        addon.authors.map((author) => author.username),
      );
      expect(root).toHaveProp('addonType', addon.type);
      expect(root).toHaveProp('forAddonSlug', addon.slug);
      expect(root).toHaveProp('numberOfAddons', 6);
    });

    it('adds a CSS class to the main component when there are add-ons', () => {
      const addon = fakeAddon;
      const addonsByAuthors = [
        { ...fakeAddon, slug: 'addon-1' },
        { ...fakeAddon, slug: 'addon-2' },
      ];
      const { store } = dispatchAddonData({ addon, addonsByAuthors });

      const root = renderComponent({ params: { slug: addon.slug }, store });

      expect(root).toHaveClassName('.Addon--has-more-than-0-addons');
      expect(root).not.toHaveClassName('.Addon--has-more-than-3-addons');
    });

    it('adds a CSS class when there are more than 3 other add-ons', () => {
      const addon = fakeAddon;
      const addonsByAuthors = [
        { ...fakeAddon, slug: 'addon-1' },
        { ...fakeAddon, slug: 'addon-2' },
        { ...fakeAddon, slug: 'addon-3' },
        { ...fakeAddon, slug: 'addon-4' },
      ];
      const { store } = dispatchAddonData({ addon, addonsByAuthors });

      const root = renderComponent({ params: { slug: addon.slug }, store });

      expect(root).toHaveClassName('.Addon--has-more-than-0-addons');
      expect(root).toHaveClassName('.Addon--has-more-than-3-addons');
    });
  });

  it('renders the site identifier as a data attribute', () => {
    const addon = createInternalAddon({ ...fakeAddon, id: 9001 });
    const root = shallowRender({ addon });

    expect(root.find('.Addon')).toHaveProp('data-site-identifier', 9001);
  });

  it('renders an HTML title', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon });

    expect(root.find('title')).toHaveText(addon.name);
  });

  it('does not render an HTML title when there is no add-on', () => {
    const root = shallowRender({ addon: null, params: { slug: 'some-slug' } });

    expect(root.find('title')).toHaveLength(0);
  });

  it('renders a ContributeCard', () => {
    const root = shallowRender();
    expect(root.find(ContributeCard)).toHaveLength(1);
  });

  describe('errorHandler - extractId', () => {
    it('generates a unique ID based on the add-on slug', () => {
      const props = renderProps({ params: { slug: 'some-slug' } });
      expect(extractId(props)).toEqual('some-slug');
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
      ownProps = {
        match: {
          params: { slug: fakeAddon.slug },
        },
      },
    ) {
      return mapStateToProps(state, ownProps);
    }

    it('can handle a missing addon', () => {
      signIn();
      const { addon, platformFiles } = _mapStateToProps();
      expect(addon).toBeFalsy();
      // Make sure this isn't undefined since it gets read from `addon`.
      expect(platformFiles).toEqual({});
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
      store.dispatch(
        setInstallState({
          ...fakeInstalledAddon,
          guid: fakeAddon.guid,
          status: INSTALLED,
        }),
      );
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
      store.dispatch(
        setInstallState({
          ...fakeInstalledAddon,
          guid: fakeAddon.guid,
          status: INSTALLED,
        }),
      );
      const { needsRestart } = _mapStateToProps();

      // Make sure a random installedAddon prop gets passed as a component prop
      // so that the withInstallHelpers HOC works.
      expect(needsRestart).toEqual(false);
    });

    it('handles a non-existant add-on', () => {
      signIn();
      const { addon } = _mapStateToProps();

      expect(addon).toEqual(null);
    });
  });
});
