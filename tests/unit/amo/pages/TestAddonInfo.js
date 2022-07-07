import { LOCATION_CHANGE } from 'connected-react-router';
import { waitFor } from '@testing-library/react';

import { createApiError } from 'amo/api/index';
import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  ADDON_INFO_TYPE_CUSTOM_LICENSE,
  ADDON_INFO_TYPE_EULA,
  ADDON_INFO_TYPE_PRIVACY_POLICY,
  extractId,
} from 'amo/pages/AddonInfo';
import {
  FETCH_ADDON,
  FETCH_ADDON_INFO,
  fetchAddon,
  fetchAddonInfo,
  loadAddonInfo,
  loadAddon,
} from 'amo/reducers/addons';
import {
  FETCH_VERSION,
  fetchVersion,
  loadVersions,
} from 'amo/reducers/versions';
import {
  changeLocation,
  createFailedErrorHandler,
  createFakeAddonInfo,
  createFakeErrorHandler,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  fakeVersion,
  getElement,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultInfoType = ADDON_INFO_TYPE_CUSTOM_LICENSE;
  const defaultSlug = 'some-slug';
  const lang = 'en-US';
  const getErrorHandlerId = ({
    infoType = defaultInfoType,
    slug = defaultSlug,
  } = {}) => `src/amo/pages/AddonInfo/index.js-${slug}-${infoType}`;
  const getFakeErrorHandler = ({
    infoType = defaultInfoType,
    slug = defaultSlug,
  } = {}) =>
    createFakeErrorHandler({ id: getErrorHandlerId({ infoType, slug }) });

  const getLocation = ({
    infoType = defaultInfoType,
    slug = defaultSlug,
  } = {}) => `/${lang}/${clientApp}/addon/${slug}/${infoType}/`;
  let addon;
  let store;
  let history;

  beforeEach(() => {
    addon = { ...fakeAddon, slug: defaultSlug };
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const render = ({ infoType = defaultInfoType, slug = defaultSlug } = {}) => {
    const renderResults = defaultRender({
      initialEntries: [getLocation({ infoType, slug })],
      store,
    });
    history = renderResults.history;
    return renderResults;
  };

  const _loadAddon = (theAddon = addon) => {
    store.dispatch(loadAddon({ addon: theAddon, slug: theAddon.slug }));
  };

  const _loadAddonInfo = ({
    addonInfo = createFakeAddonInfo(),
    slug = defaultSlug,
  } = {}) => {
    store.dispatch(loadAddonInfo({ info: addonInfo, slug }));
  };

  const _loadVersions = ({
    slug = defaultSlug,
    versions = [fakeVersion],
  } = {}) => {
    store.dispatch(loadVersions({ slug, versions }));
  };

  it.each([ADDON_INFO_TYPE_EULA, ADDON_INFO_TYPE_PRIVACY_POLICY])(
    'fetches an addon and addonInfo for %s when requested by slug',
    (infoType) => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddon({
          errorHandler: getFakeErrorHandler({ infoType }),
          showGroupedRatings: true,
          slug: defaultSlug,
        }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddonInfo({
          errorHandlerId: getErrorHandlerId({ infoType }),
          slug: defaultSlug,
        }),
      );
    },
  );

  it.each([ADDON_INFO_TYPE_EULA, ADDON_INFO_TYPE_PRIVACY_POLICY])(
    `fetches an addon and addonInfo for %s when the slug changes`,
    async (infoType) => {
      const newSlug = `${defaultSlug}-new`;
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      dispatch.mockClear();

      await changeLocation({
        history,
        pathname: getLocation({ infoType, slug: newSlug }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddon({
          errorHandler: getFakeErrorHandler({ infoType, slug: newSlug }),
          showGroupedRatings: true,
          slug: newSlug,
        }),
      );

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddonInfo({
          errorHandlerId: getErrorHandlerId({ infoType, slug: newSlug }),
          slug: newSlug,
        }),
      );
    },
  );

  it.each([ADDON_INFO_TYPE_EULA, ADDON_INFO_TYPE_PRIVACY_POLICY])(
    `does not fetch addonInfo for %s if it is already loaded`,
    (infoType) => {
      _loadAddonInfo();
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_ADDON_INFO }),
      );
    },
  );

  it.each([ADDON_INFO_TYPE_EULA, ADDON_INFO_TYPE_PRIVACY_POLICY])(
    `does not fetch addonInfo for %s if it is already loading`,
    (infoType) => {
      store.dispatch(
        fetchAddonInfo({
          errorHandlerId: getErrorHandlerId(),
          slug: defaultSlug,
        }),
      );
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_ADDON_INFO }),
      );
    },
  );

  it('passes the errorHandler to the Page component', () => {
    // We can test this by generating a 403 and checking for the not found page.
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 403 },
      }),
      id: getErrorHandlerId(),
      store,
    });
    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  describe('ADDON_INFO_TYPE_CUSTOM_LICENSE', () => {
    const infoType = ADDON_INFO_TYPE_CUSTOM_LICENSE;

    it('fetches an addon when requested by slug', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).toHaveBeenCalledWith(
        fetchAddon({
          errorHandler: getFakeErrorHandler({ infoType }),
          showGroupedRatings: true,
          slug: defaultSlug,
        }),
      );
    });

    it('does not fetch an addonVersion when there is no addon', () => {
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_VERSION }),
      );
    });

    it('does not fetch an addonVersion when the addon has no current version', () => {
      addon.current_version = null;
      _loadAddon();
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_VERSION }),
      );
    });

    it('fetches an addonVersion when the loaded version has no license text', () => {
      _loadAddon();
      _loadVersions({
        versions: [
          {
            ...fakeVersion,
            license: { ...fakeVersion.license, text: undefined },
          },
        ],
      });
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).toHaveBeenCalledWith(
        fetchVersion({
          errorHandlerId: getErrorHandlerId({ infoType }),
          slug: defaultSlug,
          versionId: addon.current_version.id,
        }),
      );
    });

    it('does not fetch an addonVersion when the loaded version has license text', () => {
      _loadAddon();
      _loadVersions({
        versions: [
          {
            ...fakeVersion,
            license: {
              ...fakeVersion.license,
              text: createLocalizedString('some text'),
            },
          },
        ],
      });
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_VERSION }),
      );
    });

    it('does not fetch an addonVersion if one is already loading', () => {
      _loadAddon();
      store.dispatch(
        fetchVersion({
          errorHandlerId: getErrorHandlerId({ infoType }),
          slug: defaultSlug,
          versionId: addon.current_version.id,
        }),
      );
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FETCH_VERSION }),
      );
    });

    it('fetches an addonVersion when the slug changes', async () => {
      const newSlug = `${defaultSlug}-new`;
      const newAddon = { ...fakeAddon, slug: newSlug };
      _loadAddon();
      _loadAddon(newAddon);
      const dispatch = jest.spyOn(store, 'dispatch');
      render({ infoType });

      dispatch.mockClear();

      await changeLocation({
        history,
        pathname: getLocation({ infoType, slug: newSlug }),
      });

      expect(dispatch).toHaveBeenCalledWith(
        fetchVersion({
          errorHandlerId: getErrorHandlerId({ infoType, slug: newSlug }),
          slug: newSlug,
          versionId: newAddon.current_version.id,
        }),
      );
    });
  });

  it('does not fetch an addon if one is already loaded', () => {
    _loadAddon();
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
  });

  it('does not fetch an addon if one is already loading', () => {
    store.dispatch(
      fetchAddon({ errorHandler: getFakeErrorHandler(), slug: defaultSlug }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
  });

  it('does not fetch anything if there is an error', () => {
    createFailedErrorHandler({
      id: getErrorHandlerId(),
      store,
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    // Expect only the LOCATION_CHANGE action which happens twice.
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: LOCATION_CHANGE }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: LOCATION_CHANGE }),
    );
  });

  it('renders LoadingText without content', () => {
    render();

    expect(
      within(screen.getByClassName('AddonInfo-info')).getByRole('alert'),
    ).toBeInTheDocument();
  });

  it('renders an AddonSummaryCard with an addon', () => {
    const name = 'My addon';
    addon.name = createLocalizedString(name);
    _loadAddon();
    render({ infoType: ADDON_INFO_TYPE_PRIVACY_POLICY });

    expect(
      screen.getByRole('heading', { name: `Privacy policy for ${name}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name })).toHaveAttribute(
      'href',
      `/${lang}/${clientApp}/addon/${defaultSlug}/`,
    );
  });

  it('renders an AddonSummaryCard without an addon', () => {
    render();

    expect(
      within(screen.getByClassName('AddonSummaryCard')).getAllByRole('alert'),
    ).toHaveLength(12);
  });

  it('renders an HTML title', async () => {
    const name = 'My addon';
    addon.name = createLocalizedString(name);
    _loadAddon();
    render({
      infoType: ADDON_INFO_TYPE_PRIVACY_POLICY,
    });

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `Privacy policy for ${name}`,
      ),
    );
  });

  it('does not render an HTML title when there is no add-on', async () => {
    render();
    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(getElement('title')).toHaveTextContent(
      `Add-ons for Firefox (${lang})`,
    );
  });

  it('renders a robots meta tag', async () => {
    _loadAddon();
    render();

    await waitFor(() =>
      expect(getElement('meta[name="robots"]')).toBeInTheDocument(),
    );

    expect(getElement('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );
  });

  it('renders an error', () => {
    const message = 'Some error message.';
    createFailedErrorHandler({
      id: getErrorHandlerId(),
      message,
      store,
    });
    render();

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders a privacy policy page', () => {
    const name = 'My addon';
    addon.name = createLocalizedString(name);
    const privacyPolicy = 'This is the privacy policy text';
    const addonInfo = createFakeAddonInfo({ privacyPolicy });

    _loadAddon();
    _loadAddonInfo({ addonInfo });

    render({ infoType: ADDON_INFO_TYPE_PRIVACY_POLICY });

    expect(screen.getAllByText(`Privacy policy for ${name}`)).toHaveLength(2);
    expect(screen.getByText(privacyPolicy)).toBeInTheDocument();
  });

  it('renders a EULA page', () => {
    const name = 'My addon';
    addon.name = createLocalizedString(name);
    const eula = 'This is the eula text';
    const addonInfo = createFakeAddonInfo({ eula });

    _loadAddon();
    _loadAddonInfo({ addonInfo });

    render({ infoType: ADDON_INFO_TYPE_EULA });

    expect(
      screen.getAllByText(`End-User License Agreement for ${name}`),
    ).toHaveLength(2);
    expect(screen.getByText(eula)).toBeInTheDocument();
  });

  it('renders a License page', () => {
    const licenseText = 'This is the license text';
    const name = 'My addon';
    addon.name = createLocalizedString(name);
    const addonVersion = {
      ...fakeVersion,
      license: {
        ...fakeVersion.license,
        text: createLocalizedString(licenseText),
      },
    };

    _loadAddon();
    _loadVersions({ versions: [addonVersion] });

    render({ infoType: ADDON_INFO_TYPE_CUSTOM_LICENSE });

    expect(screen.getAllByText(`Custom License for ${name}`)).toHaveLength(2);
    expect(screen.getByText(licenseText)).toBeInTheDocument();
  });

  it('renders an empty licence when license.text is null', () => {
    const addonVersion = {
      ...fakeVersion,
      license: {
        ...fakeVersion.license,
        text: null,
      },
    };

    _loadAddon();
    _loadVersions({ versions: [addonVersion] });

    render({ infoType: ADDON_INFO_TYPE_CUSTOM_LICENSE });

    expect(
      screen.queryByClassName('AddonInfo-info-html'),
    ).not.toBeInTheDocument();
  });

  it('renders licence in a loading state when the version has not been loaded', () => {
    _loadAddon();
    render({ infoType: ADDON_INFO_TYPE_CUSTOM_LICENSE });

    expect(
      within(screen.getByClassName('AddonInfo')).getByRole('alert'),
    ).toBeInTheDocument();
  });

  it('sanitizes the html content', () => {
    const privacyPolicy =
      'Some privacy <script>alert(document.cookie);</script> policy text';
    const addonInfo = createFakeAddonInfo({ privacyPolicy });

    _loadAddon();
    _loadAddonInfo({ addonInfo });

    render({ infoType: ADDON_INFO_TYPE_PRIVACY_POLICY });

    expect(screen.getByText('Some privacy policy text')).toBeInTheDocument();
    expect(
      // eslint-disable-next-line testing-library/prefer-presence-queries
      within(screen.getByClassName('AddonInfo-info-html')).queryByTagName(
        'script',
      ),
    ).not.toBeInTheDocument();
  });

  it('adds <br> tags for newlines in the html content', () => {
    const privacyPolicy = 'This is the privacy\npolicy';
    const addonInfo = createFakeAddonInfo({ privacyPolicy });

    _loadAddon();
    _loadAddonInfo({ addonInfo });

    render({ infoType: ADDON_INFO_TYPE_PRIVACY_POLICY });

    expect(
      within(screen.getByClassName('AddonInfo-info-html')).getAllByTagName(
        'br',
      ),
    ).toHaveLength(1);
  });

  it('allows some HTML tags', () => {
    const privacyPolicy = '<b>lots</b> <i>of</i> <a href="#">bug fixes</a>';
    const addonInfo = createFakeAddonInfo({ privacyPolicy });

    _loadAddon();
    _loadAddonInfo({ addonInfo });

    render({ infoType: ADDON_INFO_TYPE_PRIVACY_POLICY });

    expect(
      within(screen.getByClassName('AddonInfo-info-html')).getByTagName('b'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByClassName('AddonInfo-info-html')).getByTagName('i'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'bug fixes' })).toBeInTheDocument();
    expect(screen.getByClassName('AddonInfo-info-html')).toHaveTextContent(
      'lots of bug fixes',
    );
  });

  describe('extractId', () => {
    it('returns a unique id based on the addon slug and infoType', () => {
      const slug = 'some-slug';
      const infoType = ADDON_INFO_TYPE_EULA;
      const ownProps = { match: { params: { slug } }, infoType };

      expect(extractId(ownProps)).toEqual(`${slug}-${infoType}`);
    });
  });
});
