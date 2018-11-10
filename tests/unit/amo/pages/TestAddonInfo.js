import * as React from 'react';

import AddonInfo, {
  ADDON_INFO_TYPE_EULA,
  ADDON_INFO_TYPE_PRIVACY_POLICY,
  AddonInfoBase,
  extractId,
} from 'amo/pages/AddonInfo';
import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import {
  createInternalAddon,
  fetchAddon,
  fetchAddonInfo,
  loadAddonInfo,
  loadAddonResults,
} from 'core/reducers/addons';
import {
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeAddonInfo,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import ErrorList from 'ui/components/ErrorList';
import LoadingText from 'ui/components/LoadingText';

describe(__filename, () => {
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const getProps = ({
    location = createFakeLocation(),
    params,
    ...customProps
  } = {}) => {
    return {
      i18n: fakeI18n(),
      infoType: ADDON_INFO_TYPE_PRIVACY_POLICY,
      location,
      match: {
        params: {
          slug: fakeAddon.slug,
          ...params,
        },
      },
      store,
      ...customProps,
    };
  };

  const render = ({ ...customProps } = {}) => {
    const props = getProps(customProps);

    return shallowUntilTarget(<AddonInfo {...props} />, AddonInfoBase);
  };

  const _loadAddonResults = (addons = [fakeAddon]) => {
    store.dispatch(loadAddonResults({ addons }));
  };

  const _loadAddonInfo = ({
    addonInfo = fakeAddonInfo,
    slug = fakeAddon.slug,
  }) => {
    store.dispatch(loadAddonInfo({ info: addonInfo, slug }));
  };

  it('fetches an addon and addonInfo when requested by slug', () => {
    const slug = 'some-addon-slug';
    const dispatch = sinon.stub(store, 'dispatch');
    const errorHandler = createStubErrorHandler();

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.calledWith(
      dispatch,
      fetchAddon({
        errorHandler,
        slug,
      }),
    );

    sinon.assert.calledWith(
      dispatch,
      fetchAddonInfo({
        errorHandlerId: errorHandler.id,
        slug,
      }),
    );
  });

  it('does not fetch an addon if one is already loaded', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };
    _loadAddonResults([addon]);
    const errorHandler = createStubErrorHandler();

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchAddon({
        errorHandler,
        slug,
      }),
    );
  });

  it('does not fetch addonInfo if it is already loaded', () => {
    const slug = 'some-addon-slug';
    _loadAddonInfo({ slug });
    const errorHandler = createStubErrorHandler();

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchAddonInfo({
        errorHandlerId: errorHandler.id,
        slug,
      }),
    );
  });

  it('does not fetch an addon if one is already loading', () => {
    const slug = 'some-addon-slug';
    const errorHandler = createStubErrorHandler();

    store.dispatch(fetchAddon({ errorHandler, slug }));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchAddon({
        errorHandler,
        slug,
      }),
    );
  });

  it('does not fetch addonInfo if it is already loading', () => {
    const slug = 'some-addon-slug';
    const errorHandler = createStubErrorHandler();

    store.dispatch(fetchAddonInfo({ errorHandlerId: errorHandler.id, slug }));

    const fakeDispatch = sinon.stub(store, 'dispatch');

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.neverCalledWith(
      fakeDispatch,
      fetchAddonInfo({
        errorHandlerId: errorHandler.id,
        slug,
      }),
    );
  });

  it('fetches an addon and addonInfo when the slug changes', () => {
    const slug = 'some-slug';
    const newSlug = 'some-other-slug';
    const addon = { ...fakeAddon, slug };
    _loadAddonResults([addon]);
    const dispatch = sinon.stub(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    render({
      errorHandler,
      params: { slug },
    });

    dispatch.resetHistory();
    render({
      errorHandler,
      params: { slug: newSlug },
    });

    sinon.assert.calledWith(
      dispatch,
      fetchAddon({
        errorHandler,
        slug: newSlug,
      }),
    );

    sinon.assert.calledWith(
      dispatch,
      fetchAddonInfo({
        errorHandlerId: errorHandler.id,
        slug: newSlug,
      }),
    );
  });

  it('does not fetch anything if there is an error', () => {
    const slug = 'some-slug';
    const dispatch = sinon.stub(store, 'dispatch');
    const errorHandler = createStubErrorHandler(new Error('some error'));

    render({
      errorHandler,
      params: { slug },
    });

    sinon.assert.notCalled(dispatch);
  });

  it('renders LoadingText without addonInfo', () => {
    const root = render();

    expect(root.find(LoadingText)).toHaveLength(1);
  });

  it('renders an AddonSummaryCard with an addon', () => {
    const addon = fakeAddon;
    _loadAddonResults([addon]);
    const root = render({ infoType: ADDON_INFO_TYPE_PRIVACY_POLICY });

    const summary = root.find(AddonSummaryCard);
    expect(summary).toHaveProp('addon', createInternalAddon(addon));
    expect(summary).toHaveProp(
      'headerText',
      `Privacy policy for ${addon.name}`,
    );
  });

  it('renders an AddonSummaryCard without an addon', () => {
    const root = render();

    const summary = root.find(AddonSummaryCard);
    expect(summary).toHaveProp('addon', null);
    expect(summary).toHaveProp('headerText', '');
  });

  it('renders an HTML title', () => {
    const slug = 'some-slug';
    const addon = { ...fakeAddon, slug };

    _loadAddonResults([addon]);

    const root = render({
      infoType: ADDON_INFO_TYPE_PRIVACY_POLICY,
      params: { slug },
    });

    expect(root.find('title')).toHaveText(`Privacy policy for ${addon.name}`);
  });

  it('does not render an HTML title when there is no add-on', () => {
    const root = render();
    expect(root.find('title')).toHaveLength(0);
  });

  it('renders a robots meta tag', () => {
    _loadAddonResults();
    const root = render();

    expect(root.find('meta[name="robots"]')).toHaveLength(1);
    expect(root.find('meta[name="robots"]')).toHaveProp(
      'content',
      'noindex, follow',
    );
  });

  it('renders an error', () => {
    const errorHandler = createStubErrorHandler(new Error('some error'));

    const root = render({ errorHandler });
    expect(root.find(ErrorList)).toHaveLength(1);
  });

  it('renders a privacy policy page', () => {
    const slug = 'some-slug';
    const privacyPolicy = 'This is the privacy policy text';
    const addon = { ...fakeAddon, slug };
    const addonInfo = { ...fakeAddonInfo, privacy_policy: privacyPolicy };

    _loadAddonResults([addon]);
    _loadAddonInfo({ addonInfo, slug });

    const root = render({
      infoType: ADDON_INFO_TYPE_PRIVACY_POLICY,
      params: { slug },
    });

    expect(root.find('.AddonInfo-info')).toHaveProp(
      'header',
      `Privacy policy for ${addon.name}`,
    );
    expect(root.find('.AddonInfo-info-html').html()).toContain(privacyPolicy);
  });

  it('renders a EULA page', () => {
    const slug = 'some-slug';
    const eula = 'This is the eula text';
    const addon = { ...fakeAddon, slug };
    const addonInfo = { ...fakeAddonInfo, eula };

    _loadAddonResults([addon]);
    _loadAddonInfo({ addonInfo, slug });

    const root = render({
      infoType: ADDON_INFO_TYPE_EULA,
      params: { slug },
    });

    expect(root.find('.AddonInfo-info')).toHaveProp(
      'header',
      `End-User License Agreement for ${addon.name}`,
    );
    expect(root.find('.AddonInfo-info-html').html()).toContain(eula);
  });

  it('sanitizes the html content', () => {
    const slug = 'some-slug';
    const privacyPolicy = '<script>alert(document.cookie);</script>';
    const addon = { ...fakeAddon, slug };
    const addonInfo = { ...fakeAddonInfo, privacy_policy: privacyPolicy };

    _loadAddonResults([addon]);
    _loadAddonInfo({ addonInfo, slug });

    const root = render({
      infoType: ADDON_INFO_TYPE_PRIVACY_POLICY,
      params: { slug },
    });

    expect(root.find('.AddonInfo-info-html').html()).not.toContain('<script>');
  });

  it('adds <br> tags for newlines in the html content', () => {
    const slug = 'some-slug';
    const privacyPolicy = 'This is the privacy\npolicy';
    const addon = { ...fakeAddon, slug };
    const addonInfo = { ...fakeAddonInfo, privacy_policy: privacyPolicy };

    _loadAddonResults([addon]);
    _loadAddonInfo({ addonInfo, slug });

    const root = render({
      infoType: ADDON_INFO_TYPE_PRIVACY_POLICY,
      params: { slug },
    });

    expect(
      root
        .find('.AddonInfo-info-html')
        .render()
        .find('br'),
    ).toHaveLength(1);
  });

  describe('extractId', () => {
    it('returns a unique id based on the addon slug and infoType', () => {
      const slug = 'some-slug';
      const infoType = ADDON_INFO_TYPE_EULA;
      const ownProps = getProps({
        params: { slug },
        infoType,
      });

      expect(extractId(ownProps)).toEqual(`${slug}-${infoType}`);
    });
  });
});
