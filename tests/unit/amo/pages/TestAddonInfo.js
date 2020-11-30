import * as React from 'react';

import AddonSummaryCard from 'amo/components/AddonSummaryCard';
import Page from 'amo/components/Page';
import AddonInfo, {
  ADDON_INFO_TYPE_CUSTOM_LICENSE,
  ADDON_INFO_TYPE_EULA,
  ADDON_INFO_TYPE_PRIVACY_POLICY,
  AddonInfoBase,
  extractId,
} from 'amo/pages/AddonInfo';
import {
  createInternalAddon,
  fetchAddon,
  fetchAddonInfo,
  loadAddonInfo,
  loadAddon,
} from 'core/reducers/addons';
import {
  FETCH_VERSION,
  fetchVersion,
  loadVersions,
} from 'core/reducers/versions';
import {
  createCapturedErrorHandler,
  createFakeLocation,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeAddon,
  fakeAddonInfo,
  fakeI18n,
  fakeVersion,
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

  const _loadAddon = (addon = fakeAddon) => {
    store.dispatch(loadAddon({ addon, slug: addon.slug }));
  };

  const _loadAddonInfo = ({
    addonInfo = fakeAddonInfo,
    slug = fakeAddon.slug,
  }) => {
    store.dispatch(loadAddonInfo({ info: addonInfo, slug }));
  };

  const _loadVersions = ({
    slug = fakeAddon.slug,
    versions = [fakeVersion],
  }) => {
    store.dispatch(loadVersions({ slug, versions }));
  };

  it.each([ADDON_INFO_TYPE_EULA, ADDON_INFO_TYPE_PRIVACY_POLICY])(
    `fetches an addon and addonInfo for %s when requested by slug`,
    (infoType) => {
      const slug = 'some-addon-slug';
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      render({
        errorHandler,
        infoType,
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
    },
  );

  it.each([ADDON_INFO_TYPE_EULA, ADDON_INFO_TYPE_PRIVACY_POLICY])(
    `fetches an addon and addonInfo for %s when the slug changes`,
    (infoType) => {
      const slug = 'some-slug';
      const newSlug = 'some-other-slug';
      const addon = { ...fakeAddon, slug };
      _loadAddon(addon);
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();
      render({
        errorHandler,
        params: { slug },
      });

      dispatch.resetHistory();
      render({
        errorHandler,
        infoType,
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
    },
  );

  it.each([ADDON_INFO_TYPE_EULA, ADDON_INFO_TYPE_PRIVACY_POLICY])(
    `does not fetch addonInfo for %s if it is already loaded`,
    (infoType) => {
      const slug = 'some-addon-slug';
      _loadAddonInfo({ slug });
      const errorHandler = createStubErrorHandler();

      const fakeDispatch = sinon.stub(store, 'dispatch');

      render({
        errorHandler,
        infoType,
        params: { slug },
      });

      sinon.assert.neverCalledWith(
        fakeDispatch,
        fetchAddonInfo({
          errorHandlerId: errorHandler.id,
          slug,
        }),
      );
    },
  );

  it.each([ADDON_INFO_TYPE_EULA, ADDON_INFO_TYPE_PRIVACY_POLICY])(
    `does not fetch addonInfo for %s if it is already loading`,
    (infoType) => {
      const slug = 'some-addon-slug';
      const errorHandler = createStubErrorHandler();

      store.dispatch(fetchAddonInfo({ errorHandlerId: errorHandler.id, slug }));

      const fakeDispatch = sinon.stub(store, 'dispatch');

      render({
        errorHandler,
        infoType,
        params: { slug },
      });

      sinon.assert.neverCalledWith(
        fakeDispatch,
        fetchAddonInfo({
          errorHandlerId: errorHandler.id,
          slug,
        }),
      );
    },
  );

  it('passes the errorHandler to the Page component', () => {
    const errorHandler = createCapturedErrorHandler({ status: 404 });

    const root = render({ errorHandler });
    expect(root.find(Page)).toHaveProp('errorHandler', errorHandler);
  });

  describe('ADDON_INFO_TYPE_CUSTOM_LICENSE', () => {
    const renderLicenseType = ({
      errorHandler = createStubErrorHandler(),
      slug = fakeAddon.slug,
    } = {}) => {
      return render({
        errorHandler,
        infoType: ADDON_INFO_TYPE_CUSTOM_LICENSE,
        params: { slug },
      });
    };

    it('fetches an addon when requested by slug', () => {
      const slug = 'some-addon-slug';
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      renderLicenseType({ errorHandler, slug });

      sinon.assert.calledWith(
        dispatch,
        fetchAddon({
          errorHandler,
          slug,
        }),
      );
    });

    it('fetches an addonVersion when no version is loaded', () => {
      const slug = 'some-addon-slug';
      const addon = { ...fakeAddon, slug };
      _loadAddon(addon);
      const errorHandler = createStubErrorHandler();

      const dispatch = sinon.stub(store, 'dispatch');

      renderLicenseType({ errorHandler, slug });

      sinon.assert.calledWith(
        dispatch,
        fetchVersion({
          errorHandlerId: errorHandler.id,
          slug,
          versionId: addon.current_version.id,
        }),
      );
    });

    it('does not fetch an addonVersion when there is no addon', () => {
      const dispatch = sinon.stub(store, 'dispatch');

      renderLicenseType();

      sinon.assert.neverCalledWithMatch(
        dispatch,
        sinon.match({ type: FETCH_VERSION }),
      );
    });

    it('does not fetch an addonVersion when the addon has no current version', () => {
      const slug = 'some-addon-slug';
      const addon = { ...fakeAddon, slug, current_version: null };
      _loadAddon(addon);

      const dispatch = sinon.stub(store, 'dispatch');

      renderLicenseType({ slug });

      sinon.assert.neverCalledWithMatch(
        dispatch,
        sinon.match({ type: FETCH_VERSION }),
      );
    });

    it('fetches an addonVersion when the loaded version has no license text', () => {
      const slug = 'some-addon-slug';
      const addon = { ...fakeAddon, slug };
      _loadAddon(addon);
      _loadVersions({
        slug,
        versions: [
          {
            ...fakeVersion,
            license: { ...fakeVersion.license, text: undefined },
          },
        ],
      });
      const errorHandler = createStubErrorHandler();

      const dispatch = sinon.stub(store, 'dispatch');

      renderLicenseType({ errorHandler, slug });

      sinon.assert.calledWith(
        dispatch,
        fetchVersion({
          errorHandlerId: errorHandler.id,
          slug,
          versionId: addon.current_version.id,
        }),
      );
    });

    it('does not fetch an addonVersion when the loaded version has license text', () => {
      const slug = 'some-addon-slug';
      const addon = { ...fakeAddon, slug };
      _loadAddon(addon);
      _loadVersions({
        slug,
        versions: [
          {
            ...fakeVersion,
            license: { ...fakeVersion.license, text: 'some text' },
          },
        ],
      });
      const errorHandler = createStubErrorHandler();

      const dispatch = sinon.stub(store, 'dispatch');

      renderLicenseType({ errorHandler, slug });

      sinon.assert.neverCalledWith(
        dispatch,
        fetchVersion({
          errorHandlerId: errorHandler.id,
          slug,
          versionId: addon.current_version.id,
        }),
      );
    });

    it('does not fetch an addonVersion if one is already loading', () => {
      const slug = 'some-addon-slug';
      const addon = { ...fakeAddon, slug };
      _loadAddon(addon);
      const errorHandler = createStubErrorHandler();

      store.dispatch(
        fetchVersion({
          errorHandlerId: errorHandler.id,
          slug,
          versionId: addon.current_version.id,
        }),
      );

      const dispatch = sinon.stub(store, 'dispatch');

      renderLicenseType({ errorHandler, slug });

      sinon.assert.neverCalledWith(
        dispatch,
        fetchVersion({
          errorHandlerId: errorHandler.id,
          slug,
          versionId: addon.current_version.id,
        }),
      );
    });

    it('fetches an addonVersion when the slug changes', () => {
      const slug = 'some-slug';
      const newSlug = 'some-other-slug';
      const addon = { ...fakeAddon, slug };
      const newAddon = { ...fakeAddon, slug: newSlug };
      _loadAddon(addon);
      _loadAddon(newAddon);
      const dispatch = sinon.stub(store, 'dispatch');
      const errorHandler = createStubErrorHandler();

      renderLicenseType({ errorHandler, slug });

      dispatch.resetHistory();
      renderLicenseType({ errorHandler, slug: newSlug });

      sinon.assert.calledWith(
        dispatch,
        fetchVersion({
          errorHandlerId: errorHandler.id,
          slug: newSlug,
          versionId: addon.current_version.id,
        }),
      );
    });
  });

  it('does not fetch an addon if one is already loaded', () => {
    const slug = 'some-addon-slug';
    const addon = { ...fakeAddon, slug };
    _loadAddon(addon);
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

  it('renders LoadingText without content', () => {
    const root = render();

    expect(root.find(LoadingText)).toHaveLength(1);
  });

  it('renders an AddonSummaryCard with an addon', () => {
    const addon = fakeAddon;
    _loadAddon(addon);
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

    _loadAddon(addon);

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
    _loadAddon();
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

    _loadAddon(addon);
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

    _loadAddon(addon);
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

  it('renders a License page', () => {
    const slug = 'some-slug';
    const licenseText = 'This is the license text';
    const addon = { ...fakeAddon, slug };
    const addonVersion = {
      ...fakeVersion,
      license: { ...fakeVersion.license, text: licenseText },
    };

    _loadAddon(addon);
    _loadVersions({ slug, versions: [addonVersion] });

    const root = render({
      infoType: ADDON_INFO_TYPE_CUSTOM_LICENSE,
      params: { slug },
    });

    expect(root.find('.AddonInfo-info')).toHaveProp(
      'header',
      `Custom License for ${addon.name}`,
    );
    expect(root.find('.AddonInfo-info-html').html()).toContain(licenseText);
  });

  it('sanitizes the html content', () => {
    const slug = 'some-slug';
    const privacyPolicy = '<script>alert(document.cookie);</script>';
    const addon = { ...fakeAddon, slug };
    const addonInfo = { ...fakeAddonInfo, privacy_policy: privacyPolicy };

    _loadAddon(addon);
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

    _loadAddon(addon);
    _loadAddonInfo({ addonInfo, slug });

    const root = render({
      infoType: ADDON_INFO_TYPE_PRIVACY_POLICY,
      params: { slug },
    });

    expect(root.find('.AddonInfo-info-html').render().find('br')).toHaveLength(
      1,
    );
  });

  it('allows some HTML tags', () => {
    const slug = 'some-slug';
    const privacyPolicy = '<b>lots</b> <i>of</i> <a href="#">bug fixes</a>';
    const addon = { ...fakeAddon, slug };
    const addonInfo = { ...fakeAddonInfo, privacy_policy: privacyPolicy };

    _loadAddon(addon);
    _loadAddonInfo({ addonInfo, slug });

    const root = render({
      infoType: ADDON_INFO_TYPE_PRIVACY_POLICY,
      params: { slug },
    });
    expect(root.find('.AddonInfo-info-html').html()).toContain(
      '<b>lots</b> <i>of</i> <a href="#">bug fixes</a>',
    );
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
