import { shallow, mount } from 'enzyme';
import { createMemoryHistory } from 'history';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';

import { setViewContext } from 'amo/actions/viewContext';
import Addon, { AddonBase, extractId, mapStateToProps } from 'amo/pages/Addon';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonInstallError from 'amo/components/AddonInstallError';
import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import AddonRecommendations from 'amo/components/AddonRecommendations';
import AddonHead from 'amo/components/AddonHead';
import AddonTitle from 'amo/components/AddonTitle';
import ContributeCard from 'amo/components/ContributeCard';
import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import Page from 'amo/components/Page';
import PermissionsCard from 'amo/components/PermissionsCard';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import InstallWarning from 'amo/components/InstallWarning';
import RatingManager, {
  RatingManagerWithI18n,
} from 'amo/components/RatingManager';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import { reviewListURL } from 'amo/reducers/reviews';
import { getAddonURL } from 'amo/utils';
import { createInternalVersion } from 'core/reducers/versions';
import createStore from 'amo/store';
import {
  createInternalAddon,
  fetchAddon as fetchAddonAction,
  loadAddon,
} from 'core/reducers/addons';
import {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { setInstallError, setInstallState } from 'core/reducers/installations';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
  FATAL_ERROR,
  INSTALLING,
  UNKNOWN,
} from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import { addQueryParamsToHistory } from 'core/utils';
import {
  createCapturedErrorHandler,
  createFakeClientCompatibility,
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  dispatchSignInActions,
  fakeAddon,
  fakeI18n,
  fakeTheme,
  fakeVersion,
  sampleUserAgentParsed,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';
import ThemeImage from 'ui/components/ThemeImage';
import Notice from 'ui/components/Notice';

function renderProps({
  addon = createInternalAddon(fakeAddon),
  params,
  currentVersion = createInternalVersion(fakeVersion),
  ...customProps
} = {}) {
  const i18n = fakeI18n();
  const addonProps = addon || {};
  return {
    addon,
    ...addonProps,
    dispatch: sinon.stub(),
    errorHandler: createStubErrorHandler(),
    getClientCompatibility: () => {
      return createFakeClientCompatibility({
        compatible: true,
        reason: null,
      });
    },
    i18n,
    location: createFakeLocation(),
    match: {
      params: params || { slug: addon ? addon.slug : fakeAddon.slug },
    },
    // Configure Addon with a non-redux depdendent RatingManager.
    RatingManager: RatingManagerWithI18n,
    store: dispatchClientMetadata().store,
    currentVersion,
    status: UNKNOWN,
    // Other props
    id: 'some id',
    // TODO: We can likely remove this when we get rid of shallow rendering.
    // See https://github.com/mozilla/addons-frontend/issues/6858
    userAgentInfo: sampleUserAgentParsed,
    ...customProps,
  };
}

function renderAsDOMNode(customProps) {
  const { store, i18n, ...props } = renderProps({
    // Use the real RatingManager since we're doing a full mount.
    RatingManager,
    ...customProps,
  });
  props.i18n = i18n;

  const history = addQueryParamsToHistory({
    history: createMemoryHistory(),
  });

  return mount(
    <Provider store={store}>
      <I18nProvider i18n={i18n}>
        <Router history={history}>
          <AddonBase store={store} {...props} />
        </Router>
      </I18nProvider>
    </Provider>,
  );
}

function renderComponent(otherProps = {}) {
  const props = renderProps({ errorHandler: undefined, ...otherProps });
  return shallowUntilTarget(<Addon {...props} />, AddonBase);
}

function shallowRender(...args) {
  const props = renderProps(...args);
  return shallow(<AddonBase {...props} />, { context: { i18n: props.i18n } });
}

describe(__filename, () => {
  const _loadAddon = ({ addon = fakeAddon, slug = addon.slug }) => {
    return loadAddon({ addon, slug });
  };

  const _loadAddonsByAuthors = ({ addon, addonsByAuthors }) => {
    return loadAddonsByAuthors({
      addons: addonsByAuthors,
      authorIds: [123],
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
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_STATIC_THEME,
      }),
    });

    sinon.assert.calledWith(
      fakeDispatch,
      setViewContext(ADDON_TYPE_STATIC_THEME),
    );
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
    const { store } = dispatchClientMetadata();

    const errorHandler = createCapturedErrorHandler({ status: 400, store });
    const fakeDispatch = sinon.spy(store, 'dispatch');

    renderComponent({ store, errorHandler });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('does not dispatch any new actions if error handler has an error on update', () => {
    const { store } = dispatchClientMetadata();
    const fakeDispatch = sinon.spy(store, 'dispatch');

    // First render.
    const root = renderComponent({ store });

    const errorHandler = createCapturedErrorHandler({ status: 400, store });
    fakeDispatch.resetHistory();
    // This will trigger a second render (update).
    root.setProps({ errorHandler });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('renders an AddonTitle component', () => {
    const root = shallowRender();
    expect(root.find(AddonTitle)).toHaveLength(1);
  });

  it('renders an AddonHead component', () => {
    const root = shallowRender();
    expect(root.find(AddonHead)).toHaveLength(1);
  });

  it('renders a WrongPlatformWarning component', () => {
    const addon = createInternalAddon(fakeAddon);
    const currentVersion = createInternalVersion(fakeVersion);
    const root = shallowRender({
      addon,
      currentVersion,
    });

    expect(root.find(WrongPlatformWarning)).toHaveLength(1);
    expect(root.find(WrongPlatformWarning)).toHaveProp('addon', addon);
  });

  it('does not render a WrongPlatformWarning component without an addon', () => {
    const root = shallowRender({
      addon: null,
    });

    expect(root.find(WrongPlatformWarning)).toHaveLength(0);
  });

  it('renders without an add-on', () => {
    const errorHandler = createStubErrorHandler();
    const slugParam = 'some-addon'; // as passed through the URL.

    // Simulate the case when an add-on has not been loaded into state yet.
    const root = shallowRender({
      addon: null,
      currentVersion: null,
      errorHandler,
      params: { slug: slugParam },
    });

    // These should be empty:
    expect(root.find(InstallButtonWrapper)).toHaveLength(0);
    expect(root.find(AddonCompatibilityError)).toHaveProp('addon', null);
    expect(root.find(RatingManager)).toHaveLength(0);

    // These should show LoadingText
    expect(root.find('.AddonDescription').prop('header')).toEqual(
      <LoadingText width={40} />,
    );
    expect(
      root.find('.AddonDescription-contents').find(LoadingText),
    ).toHaveLength(1);
    expect(root.find('.Addon-summary').find(LoadingText)).toHaveLength(1);
    expect(
      root.find('.Addon-overall-rating').shallow().find(LoadingText),
    ).toHaveLength(1);

    // These should render with an empty addon (they will show their own
    // loading state).
    expect(root.find(AddonMeta)).toHaveProp('addon', null);
    expect(root.find(AddonMoreInfo)).toHaveProp('addon', null);
    expect(root.find(AddonMoreInfo)).toHaveLength(1);
    expect(root.find(AddonTitle)).toHaveProp('addon', null);
    expect(root.find(AddonHead)).toHaveProp('addon', null);
    expect(root.find('.Addon-icon img').prop('alt')).toEqual(null);
  });

  it('renders without a version', () => {
    const { store } = dispatchSignInActions();
    const addon = { ...fakeAddon, current_version: null };

    store.dispatch(_loadAddon({ addon }));

    const root = renderComponent({ store });

    expect(root.find('.Addon')).toHaveLength(1);
    expect(root.find('.Addon')).toHaveProp('data-site-identifier', addon.id);
  });

  it('dispatches fetchAddon when rendering without an add-on', () => {
    const slug = 'some-addon';
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderComponent({ addon: undefined, params: { slug }, store });

    // Since there's no add-on, it should be fetched on load.
    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonAction({
        errorHandler: root.instance().props.errorHandler,
        slug,
      }),
    );
  });

  it('does not dispatch fetchAddon when already loading', () => {
    const errorHandler = createStubErrorHandler();
    const slug = 'some-addon';
    const { store } = dispatchClientMetadata();

    // Start fetching an add-on.
    store.dispatch(
      fetchAddonAction({
        errorHandler,
        slug,
      }),
    );

    const dispatchSpy = sinon.spy(store, 'dispatch');
    renderComponent({
      addon: undefined,
      errorHandler,
      params: { slug },
      store,
    });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not dispatch fetchAddon when slugs are the same', () => {
    const fakeDispatch = sinon.stub();
    const errorHandler = createStubErrorHandler();
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon, errorHandler, dispatch: fakeDispatch });

    fakeDispatch.resetHistory();
    // Update with the same slug.
    root.setProps({ params: { slug: addon.slug } });

    sinon.assert.notCalled(fakeDispatch);
  });

  it('dispatches fetchAddon when updating to a new slug', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderComponent({ store });
    const slug = 'some-new-slug';

    dispatchSpy.resetHistory();
    // Update to a new slug.
    root.setProps({ match: { params: { slug } } });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonAction({
        errorHandler: root.instance().props.errorHandler,
        slug,
      }),
    );
  });

  it('dispatches fetchAddon when updating to an empty addon', () => {
    const slug = 'some-addon';
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const root = renderComponent({ params: { slug }, store });

    dispatchSpy.resetHistory();
    // Simulate unloading an add-on from state.
    root.setProps({ addon: undefined });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchAddonAction({
        errorHandler: root.instance().props.errorHandler,
        slug,
      }),
    );
  });

  it('does not dispatch fetchAddon on update when already loading', () => {
    const errorHandler = createStubErrorHandler();
    const slug = 'some-addon';
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    // Start fetching an add-on.
    store.dispatch(
      fetchAddonAction({
        errorHandler,
        slug,
      }),
    );

    const root = renderComponent({
      errorHandler,
      params: { slug },
      store,
    });

    dispatchSpy.resetHistory();
    // Simulate unloading an add-on from state.
    root.setProps({ addon: undefined });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('renders an error if there is one', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));

    const root = shallowRender({ errorHandler });
    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('passes the errorHandler to the Page component', () => {
    const errorHandler = createCapturedErrorHandler({ status: 404 });

    const root = shallowRender({ errorHandler });
    expect(root.find(Page)).toHaveProp('errorHandler', errorHandler);
  });

  it('dispatches a server redirect when slug is a numeric ID', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = fakeAddon;
    // This is what happens when we load an add-on detail page using an ID.
    const params = { slug: addon.id };
    store.dispatch(_loadAddon({ addon, slug: params.slug }));

    const fakeDispatch = sinon.spy(store, 'dispatch');
    renderComponent({ params, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}${getAddonURL(addon.slug)}`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('dispatches a server redirect when slug has trailing spaces', () => {
    const slug = 'some-slug';

    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = { ...fakeAddon, slug };
    // This is what happens when we load an add-on detail page with a slug that
    // has trailing spaces.
    const params = { slug: `${slug}  ` };
    store.dispatch(_loadAddon({ addon, slug: params.slug }));

    const fakeDispatch = sinon.spy(store, 'dispatch');
    renderComponent({ params, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}${getAddonURL(addon.slug)}`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it('dispatches a server redirect when slug is a stringified integer greater than 0', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = fakeAddon;
    // We set the numeric `id` as slug, casted as a string.
    const params = { slug: `${addon.id}` };
    store.dispatch(_loadAddon({ addon, slug: params.slug }));

    const fakeDispatch = sinon.spy(store, 'dispatch');
    renderComponent({ params, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}${getAddonURL(addon.slug)}`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  // The reason for this test case came from https://github.com/mozilla/addons-frontend/issues/4541.
  it('does not dispatch a server redirect when slug is a stringified integer less than 0', () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = {
      ...fakeAddon,
      slug: '-1234',
    };

    const params = { slug: addon.slug };
    store.dispatch(_loadAddon({ addon, slug: params.slug }));

    const fakeDispatch = sinon.spy(store, 'dispatch');
    renderComponent({ params, store });

    sinon.assert.calledWith(fakeDispatch, setViewContext(fakeAddon.type));
    sinon.assert.callCount(fakeDispatch, 1);
  });

  // See: https://github.com/mozilla/addons-frontend/issues/4271.
  it("dispatches a server redirect when slug param case does not match the add-on's slug case", () => {
    const slug = 'some-slug';

    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = { ...fakeAddon, slug };
    // Set the slug param to all uppercase.
    const params = { slug: slug.toUpperCase() };
    store.dispatch(_loadAddon({ addon, slug: params.slug }));

    const fakeDispatch = sinon.spy(store, 'dispatch');
    renderComponent({ params, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}${getAddonURL(addon.slug)}`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
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

    expect(root.find('.Addon-summary').render().find('br')).toHaveLength(1);
  });

  it('sanitizes bad description HTML', () => {
    const scriptHTML = '<script>alert(document.cookie);</script>';
    const addon = {
      ...fakeAddon,
      description: scriptHTML,
    };

    const { store } = dispatchClientMetadata();
    store.dispatch(_loadAddon({ addon }));

    const root = renderComponent({ params: { slug: addon.slug }, store });

    // Make sure an actual script tag was not created and make sure the script
    // has been removed.
    expect(root.find('.AddonDescription-contents').html()).toEqual(
      '<div class="AddonDescription-contents"></div>',
    );
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

  it('sets a title for the description of a generic add-on', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: 'generic-type',
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
    const root = renderAsDOMNode({ addon });
    expect(root.find('.AddonDescription')).toHaveLength(0);
  });

  it('hides the description if description and summary are blank', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      description: '',
      summary: '',
    });
    const root = renderAsDOMNode({ addon });
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

  it('does not display anything when the extension has no description', () => {
    const summary = 'my theme is very cool';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_EXTENSION,
        summary,
        description: null,
      }),
    });

    expect(root.find('.AddonDescription')).toHaveLength(0);
  });

  it('does not display anything when the language pack has no description', () => {
    const summary = 'my theme is very cool';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_LANG,
        summary,
        description: null,
      }),
    });

    expect(root.find('.AddonDescription')).toHaveLength(0);
  });

  it('does not display anything when the dictionary has no description', () => {
    const summary = 'my theme is very cool';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        type: ADDON_TYPE_DICT,
        summary,
        description: null,
      }),
    });

    expect(root.find('.AddonDescription')).toHaveLength(0);
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
    const root = renderAsDOMNode({
      addon: createInternalAddon({
        ...fakeAddon,
        description: '\n\n\n',
      }),
    });
    expect(root.find('.AddonDescription-contents').html()).toContain(
      '<br>'.repeat(3),
    );
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
    const root = renderAsDOMNode({
      addon: createInternalAddon({
        ...fakeAddon,
        description:
          '<a href="javascript:alert(document.cookie)" onclick="sneaky()">placeholder</a>',
      }),
    });

    expect(root.find('.AddonDescription').at(0).html()).toContain(
      '<a>placeholder</a>',
    );
  });

  it('hides developer comments if null', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      developer_comments: null,
    });
    const root = renderComponent({ addon });
    expect(root.find('.Addon-developer-comments')).toHaveLength(0);
  });

  it('displays developer comments', () => {
    const developerComments = 'some awesome developers comments';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        developer_comments: developerComments,
      }),
    });
    expect(root.find('.Addon-developer-comments').childAt(0).html()).toContain(
      developerComments,
    );
  });

  it('allows some HTML tags in the developer comments', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        developer_comments: '<b>super</b> <i>cool</i> <blink>comments</blink>',
      }),
    });
    expect(root.find('.Addon-developer-comments').childAt(0).html()).toMatch(
      new RegExp('<b>super</b> <i>cool</i> comments'),
    );
  });

  it('configures the overall ratings section', () => {
    const location = createFakeLocation();
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({
      addon,
      location,
      currentVersion: createInternalVersion(fakeVersion),
    }).find(RatingManagerWithI18n);
    expect(root.prop('addon')).toEqual(addon);
    expect(root.prop('location')).toEqual(location);
  });

  it('does not show a ratings manager without a version', () => {
    const root = shallowRender({
      addon: createInternalAddon(fakeAddon),
      currentVersion: null,
    });

    expect(root.find(RatingManagerWithI18n)).toHaveLength(0);
    expect(root.find('.Addon-no-rating-manager')).toHaveLength(1);
  });

  it('renders a summary', () => {
    const root = shallowRender();
    expect(root.find('.Addon-summary').html()).toContain(fakeAddon.summary);
  });

  it('renders a summary with links', () => {
    const summary = '<a href="http://foo.com/">my website</a>';
    const root = renderAsDOMNode({
      addon: createInternalAddon({
        ...fakeAddon,
        summary,
      }),
    });

    expect(root.find('.Addon-summary').html()).toContain(summary);
  });

  it('renders an amo CDN icon image', () => {
    const iconURL = 'https://addons.cdn.mozilla.net/foo.jpg';
    const addonName = 'some-addon-name';
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeAddon,
        icon_url: iconURL,
        name: addonName,
      }),
    });
    const image = root.find('.Addon-icon img');
    expect(image.prop('src')).toEqual(iconURL);
    expect(image.prop('alt')).toEqual(`Preview of ${addonName}`);
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

  it('renders screenshots for type extension', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_EXTENSION,
      }),
    });
    expect(root.find('.Addon-screenshots')).toHaveLength(1);
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

  it('uses Addon-theme class if it is a static theme', () => {
    const root = shallowRender({
      addon: createInternalAddon({
        ...fakeTheme,
        type: ADDON_TYPE_STATIC_THEME,
      }),
    });
    expect(root.find('.Addon-theme')).toHaveLength(1);
  });

  it('passes the addon to AddonCompatibilityError', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({
      addon,
    });

    expect(root.find(AddonCompatibilityError)).toHaveProp('addon', addon);
  });

  it('renders a ThemeImage in the header', () => {
    const root = shallowRender({ addon: createInternalAddon(fakeTheme) });
    expect(root.find(ThemeImage)).toHaveLength(1);
    expect(root.find(ThemeImage)).toHaveProp('roundedCorners', true);
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
    const currentVersion = createInternalVersion(fakeVersion);
    const root = shallowRender({ currentVersion });
    expect(root.find(PermissionsCard)).toHaveProp('version', currentVersion);
  });

  it('renders permissions with no version', () => {
    const root = shallowRender({ currentVersion: null });
    expect(root.find(PermissionsCard)).toHaveProp('version', null);
  });

  it('renders recommendations for an extension', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = shallowRender({ addon });
    expect(root.find(AddonRecommendations)).toHaveLength(1);
    expect(root.find(AddonRecommendations)).toHaveProp('addon', addon);
  });

  it('renders recommendations for an extension with no loaded add-on', () => {
    const root = shallowRender({ addon: null });
    expect(root.find(AddonRecommendations)).toHaveLength(1);
    expect(root.find(AddonRecommendations)).toHaveProp('addon', null);
  });

  it('does not render recommendations if the add-on is not an extension', () => {
    for (const addonType of [
      ADDON_TYPE_DICT,
      ADDON_TYPE_LANG,
      ADDON_TYPE_STATIC_THEME,
    ]) {
      const addon = createInternalAddon({
        ...fakeAddon,
        type: addonType,
      });
      const root = shallowRender({ addon });
      expect(root.find(AddonRecommendations)).toHaveLength(0);
    }
  });

  describe('read reviews footer', () => {
    function readReviewsCard({
      addonSlug = fakeAddon.slug,
      ratingsCount = 1,
      ...customProps
    }) {
      const { store } = dispatchSignInActions();
      const addon = {
        ...fakeAddon,
        slug: addonSlug,
        ratings: {
          ...fakeAddon.ratings,
          count: ratingsCount,
        },
      };

      store.dispatch(_loadAddon({ addon }));

      const root = renderComponent({
        addon: createInternalAddon(addon),
        store,
        ...customProps,
      });
      return root.find('.Addon-overall-rating');
    }

    const allReviewsLink = (card) => {
      return shallow(card.prop('footerLink')).find('.Addon-all-reviews-link');
    };

    it('only links to reviews when they exist', () => {
      const card = readReviewsCard({
        ratingsCount: 0,
      });

      expect(card).not.toHaveProp('footerLink');
      const footerText = shallow(card.prop('footerText'));
      expect(footerText).toHaveText('No reviews yet');
      expect(footerText).toHaveClassName('Addon-read-reviews-footer');
    });

    it('prompts you to read one review', () => {
      const card = readReviewsCard({
        ratingsCount: 1,
      });

      expect(allReviewsLink(card).children()).toHaveText('Read 1 review');
    });

    it('prompts you to read many reviews', () => {
      const card = readReviewsCard({
        ratingsCount: 5,
      });

      expect(allReviewsLink(card).children()).toHaveText('Read all 5 reviews');
    });

    it('localizes the review count', () => {
      const card = readReviewsCard({
        ratingsCount: 10000,
      });

      expect(allReviewsLink(card).children()).toIncludeText('10,000');
    });

    it('links to all reviews', () => {
      const addonSlug = 'adblock-plus';
      const card = readReviewsCard({
        addonSlug,
        ratingsCount: 2,
      });

      const link = allReviewsLink(card);
      expect(link).toHaveLength(1);
      expect(link).toHaveProp('to', reviewListURL({ addonSlug }));
    });

    it('adds UTM query parameters to the all reviews link when there are some', () => {
      const utm_campaign = 'some-utm-campaign';
      const location = createFakeLocation({ query: { utm_campaign } });
      const addonSlug = 'adblock-plus';

      const card = readReviewsCard({
        addonSlug,
        ratingsCount: 2,
        location,
      });

      expect(allReviewsLink(card)).toHaveProp(
        'to',
        `${getAddonURL(addonSlug)}reviews/?utm_campaign=${utm_campaign}`,
      );
    });
  });

  describe('version release notes', () => {
    function renderWithVersion(props = {}) {
      return shallowRender({
        currentVersion: createInternalVersion({ ...fakeVersion, ...props }),
      });
    }

    function getReleaseNotes(releaseNotes) {
      const root = renderWithVersion({ release_notes: releaseNotes });
      return root.find('.AddonDescription-version-notes div').render();
    }

    it('is hidden when an add-on has not loaded yet', () => {
      const root = shallowRender({ addon: null });
      expect(root.find('.AddonDescription-version-notes div')).toHaveLength(0);
    });

    it('is hidden when the add-on does not have a current version', () => {
      const root = shallowRender({ currentVersion: null });
      expect(root.find('.AddonDescription-version-notes div')).toHaveLength(0);
    });

    it('is hidden when the current version does not have release notes', () => {
      const root = renderWithVersion({ release_notes: null });
      expect(root.find('.AddonDescription-version-notes div')).toHaveLength(0);
    });

    it('shows the version string', () => {
      const version = 'v1.4.5';
      const root = renderWithVersion({ version });
      const card = root.find('.AddonDescription-version-notes');
      expect(card.prop('header')).toEqual('Release notes for v1.4.5');
    });

    it('shows the release notes', () => {
      const releaseNotes = 'Fixed some stuff';
      const root = renderWithVersion({ release_notes: releaseNotes });
      const notes = root.find('.AddonDescription-version-notes div');
      expect(notes.html()).toContain(releaseNotes);
    });

    it('allows some HTML tags', () => {
      const root = getReleaseNotes(
        '<b>lots</b> <i>of</i> <blink>bug fixes</blink>',
      );
      expect(root.html()).toMatch(
        new RegExp('<b>lots</b> <i>of</i> bug fixes'),
      );
    });

    it('allows some ul-li tags', () => {
      const root = getReleaseNotes(
        '<b>The List</b><ul><li>one</li><li>two</li></ul>',
      );
      expect(root.html()).toMatch(
        new RegExp('<b>The List</b><ul><li>one</li><li>two</li></ul>'),
      );
    });
  });

  describe('more add-ons by authors', () => {
    const dispatchAddonData = ({ addon, addonsByAuthors }) => {
      const { store } = dispatchClientMetadata();

      store.dispatch(_loadAddon({ addon }));

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
      const addon = fakeAddon;
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
        'authorIds',
        addon.authors.map((author) => author.id),
      );
      expect(root).toHaveProp('addonType', addon.type);
      expect(root).toHaveProp('forAddonSlug', addon.slug);
      expect(root).toHaveProp('numberOfAddons', 6);
    });

    it('displays more add-ons by authors when add-on is a theme', () => {
      const addon = fakeTheme;
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
        'authorIds',
        addon.authors.map((author) => author.id),
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

      const root = renderComponent({
        params: { slug: addon.slug },
        store,
      }).find('.Addon');

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

      const root = renderComponent({
        params: { slug: addon.slug },
        store,
      }).find('.Addon');

      expect(root).toHaveClassName('.Addon--has-more-than-0-addons');
      expect(root).toHaveClassName('.Addon--has-more-than-3-addons');
    });
  });

  it('renders the site identifier as a data attribute', () => {
    const id = 9001;
    const addon = createInternalAddon({ ...fakeAddon, id });
    const root = shallowRender({ addon });

    expect(root.find('.Addon')).toHaveProp('data-site-identifier', id);
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
      store.dispatch(_loadAddon({ addon }));
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

    it('sets the clientApp', () => {
      const clientAppFromAgent = 'firefox';
      signIn({ clientApp: clientAppFromAgent });
      fetchAddon();
      const { clientApp } = _mapStateToProps();

      expect(clientApp).toEqual(clientAppFromAgent);
    });

    it('sets the version for a loaded add-on', () => {
      const versionId = 111;
      const apiVersion = { ...fakeVersion, id: versionId };
      signIn();
      fetchAddon({
        addon: {
          ...fakeAddon,
          current_version: apiVersion,
        },
      });

      const { currentVersion } = _mapStateToProps();
      expect(currentVersion).toEqual(createInternalVersion(apiVersion));
    });

    it('handles a non-existent add-on', () => {
      signIn();
      const { addon, currentVersion } = _mapStateToProps();

      expect(addon).toEqual(null);
      expect(currentVersion).toEqual(null);
    });
  });

  describe('InstallButtonWrapper', () => {
    let addon;
    let store;

    beforeEach(() => {
      addon = fakeAddon;
      store = dispatchClientMetadata().store;
      store.dispatch(_loadAddon({ addon }));
    });

    it('renders the InstallButtonWrapper', () => {
      const root = renderComponent({ store });

      expect(root.find(InstallButtonWrapper)).toHaveLength(1);
    });

    it('passes the addon to the InstallButtonWrapper', () => {
      const internalAddon = createInternalAddon(addon);

      const root = renderComponent({ addon: internalAddon, store });

      expect(root.find(InstallButtonWrapper)).toHaveProp(
        'addon',
        internalAddon,
      );
    });
  });

  // Non-public add-ons require an account listed as a developer of the add-on
  // or admin rights.
  it('displays a notice to admin/developer when add-on is not fully reviewed', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      status: 'disabled',
    });

    const root = shallowRender({ addon });
    expect(root.find(Notice)).toHaveLength(1);
  });

  it('does not display a notice when add-on is fully reviewed', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      status: 'public',
    });

    const root = shallowRender({ addon });

    expect(root.find(Notice)).toHaveLength(0);
  });

  // Non-public add-ons require an account listed as a developer of the add-on
  // or admin rights.
  it('displays a notice to admin/developer when an add-on is disabled', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      is_disabled: true,
    });

    const root = shallowRender({ addon });
    expect(root.find(Notice)).toHaveLength(1);
  });

  it('does not display a notice when add-on is not disabled', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      is_disabled: false,
    });

    const root = shallowRender({ addon });

    expect(root.find(Notice)).toHaveLength(0);
  });

  it('renders an AddonInstallError component', () => {
    const root = shallowRender();

    expect(root.find(AddonInstallError)).toHaveLength(1);
  });

  it('passes an error to the AddonInstallError component', () => {
    const addon = fakeAddon;
    const { store } = dispatchClientMetadata();
    store.dispatch(_loadAddon({ addon }));
    // User clicks the install button.
    store.dispatch(
      setInstallState({
        guid: addon.guid,
        status: INSTALLING,
      }),
    );
    // An error has occurred in FF.
    const error = FATAL_ERROR;
    store.dispatch(setInstallError({ error, guid: addon.guid }));

    const root = renderComponent({ store });

    expect(root.find(AddonInstallError)).toHaveProp('error', error);
  });

  it(`dispatches a server redirect when slug is the add-on's GUID`, () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const guid = 'this_is@a.guid';
    const addon = { ...fakeAddon, guid };
    const params = { slug: guid };
    store.dispatch(_loadAddon({ addon, slug: params.slug }));
    const fakeDispatch = sinon.spy(store, 'dispatch');

    renderComponent({ params, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}${getAddonURL(addon.slug)}`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it(`dispatches a server redirect when slug contains very similar characters`, () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const addon = { ...fakeAddon, slug: 'some-slug' };
    // We change the slug to simulate an API response for a slug that isn't
    // strictly the add-on's slug.
    const params = { slug: 'söme-slug' };
    store.dispatch(_loadAddon({ addon, slug: params.slug }));
    const fakeDispatch = sinon.spy(store, 'dispatch');

    renderComponent({ params, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}${getAddonURL(addon.slug)}`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  it(`dispatches a server redirect when slug is the add-on's GUID using a different case`, () => {
    const clientApp = CLIENT_APP_FIREFOX;
    const { store } = dispatchClientMetadata({ clientApp });
    const guid = 'this_is@a.guid';
    const addon = { ...fakeAddon, guid };
    // We change the GUID case and simulate the loading of an URL containing
    // that slug in uppercase.
    const params = { slug: guid.toUpperCase() };
    store.dispatch(_loadAddon({ addon, slug: params.slug }));
    const fakeDispatch = sinon.spy(store, 'dispatch');

    renderComponent({ params, store });

    sinon.assert.calledWith(
      fakeDispatch,
      sendServerRedirect({
        status: 301,
        url: `/en-US/${clientApp}${getAddonURL(addon.slug)}`,
      }),
    );
    sinon.assert.callCount(fakeDispatch, 1);
  });

  describe('InstallWarning', () => {
    let addon;
    let store;

    beforeEach(() => {
      addon = fakeAddon;
      store = dispatchClientMetadata().store;
    });

    it('renders the InstallWarning if an add-on exists', () => {
      store.dispatch(_loadAddon({ addon }));
      const root = renderComponent({ store });

      expect(root.find(InstallWarning)).toHaveLength(1);
    });

    it('does not render the InstallWarning if an add-on does not exist', () => {
      const root = renderComponent({ store });

      expect(root.find(InstallWarning)).toHaveLength(0);
    });

    it('passes the addon to the InstallWarning', () => {
      const internalAddon = createInternalAddon(addon);
      store.dispatch(_loadAddon({ addon }));

      const root = renderComponent({ addon: internalAddon, store });

      expect(root.find(InstallWarning)).toHaveProp('addon', internalAddon);
    });
  });
});
