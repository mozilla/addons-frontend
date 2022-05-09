import { waitFor } from '@testing-library/react';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import { formatFilesize } from 'amo/i18n/utils';
import { extractId } from 'amo/pages/AddonVersions';
import { FETCH_ADDON, fetchAddon, loadAddon } from 'amo/reducers/addons';
import {
  FETCH_VERSIONS,
  loadVersions,
  fetchVersions,
} from 'amo/reducers/versions';
import {
  createFailedErrorHandler,
  createFakeErrorHandler,
  createHistory,
  createLocalizedString,
  dispatchClientMetadata,
  fakeAddon,
  fakeFile,
  fakeI18n,
  fakeVersion,
  getElement,
  onLocationChanged,
  renderPage as defaultRender,
  screen,
  userAgents,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let store;
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultSlug = 'some-add-on-slug';
  const lang = 'en-US';

  const getLocation = (slug = defaultSlug) =>
    `/${lang}/${clientApp}/addon/${slug}/versions/`;

  const getErrorHandlerId = ({ page = '', slug = defaultSlug } = {}) =>
    `src/amo/pages/AddonVersions/index.js-${slug}-${page}`;
  const getFakeErrorHandler = ({ page = '', slug = defaultSlug } = {}) =>
    createFakeErrorHandler({ id: getErrorHandlerId({ page, slug }) });

  beforeEach(() => {
    store = dispatchClientMetadata().store;
  });

  const render = ({ history, location, slug = defaultSlug } = {}) => {
    const initialEntry = location || getLocation(slug);

    const renderOptions = {
      history:
        history ||
        createHistory({
          initialEntries: [initialEntry],
        }),
      store,
    };
    return defaultRender(renderOptions);
  };

  const _loadAddon = (addon = { ...fakeAddon, slug: defaultSlug }) => {
    store.dispatch(loadAddon({ addon, slug: addon.slug }));
  };

  const _loadVersions = ({
    slug = defaultSlug,
    versions = [fakeVersion],
  } = {}) => {
    store.dispatch(loadVersions({ slug, versions }));
  };

  const allVersionCards = () => screen.getAllByClassName('AddonVersionCard');

  it('does not fetch anything if there is an error', () => {
    createFailedErrorHandler({ id: getErrorHandlerId(), store });
    const dispatch = jest.spyOn(store, 'dispatch');

    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_VERSIONS }),
    );
  });

  it('fetches an addon when requested by slug', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      fetchAddon({
        errorHandler: getFakeErrorHandler(),
        showGroupedRatings: true,
        slug: defaultSlug,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_ADDON }),
    );
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

  it('fetches an addon when the slug changes', () => {
    const slug = 'some-slug';
    const newSlug = 'some-other-slug';
    const addon = { ...fakeAddon, slug };

    _loadAddon(addon);

    const dispatch = jest.spyOn(store, 'dispatch');
    render({ location: getLocation(slug) });

    store.dispatch(onLocationChanged({ pathname: getLocation(newSlug) }));

    expect(dispatch).toHaveBeenCalledWith(
      fetchAddon({
        errorHandler: getFakeErrorHandler({ slug: newSlug }),
        showGroupedRatings: true,
        slug: newSlug,
      }),
    );
  });

  it('fetches versions when versions are not loaded', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledWith(
      fetchVersions({
        errorHandlerId: getErrorHandlerId(),
        slug: defaultSlug,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_VERSIONS }),
    );
  });

  it('does not fetch versions if they are already loading', () => {
    _loadAddon();
    store.dispatch(
      fetchVersions({ errorHandlerId: getErrorHandlerId(), slug: defaultSlug }),
    );
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_VERSIONS }),
    );
  });

  it('does not fetch versions if they are already loaded', () => {
    _loadAddon();
    _loadVersions();
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_VERSIONS }),
    );
  });

  it('fetches versions when the slug changes', () => {
    const slug = 'some-slug';
    const newSlug = 'some-other-slug';
    const addon = { ...fakeAddon, slug };

    _loadAddon(addon);

    const dispatch = jest.spyOn(store, 'dispatch');
    render({ location: getLocation(slug) });

    store.dispatch(onLocationChanged({ pathname: getLocation(newSlug) }));

    expect(dispatch).toHaveBeenCalledWith(
      fetchVersions({
        errorHandlerId: getErrorHandlerId({ slug: newSlug }),
        slug: newSlug,
      }),
    );
  });

  it('generates an empty header when no add-on is loaded', async () => {
    render();

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(
      screen.getByClassName('AddonSummaryCard-header-text'),
    ).toHaveTextContent('');
    expect(getElement('title')).toHaveTextContent(
      'Add-ons for Firefox (en-US)',
    );
  });

  it('generates an empty header when no versions have loaded', async () => {
    _loadAddon();
    render();

    await waitFor(() => expect(getElement('title')).toBeInTheDocument());

    expect(
      within(
        screen.getByClassName('AddonSummaryCard-header-text'),
      ).getByClassName('visually-hidden'),
    ).toHaveTextContent('');
    expect(getElement('title')).toHaveTextContent(
      'Add-ons for Firefox (en-US)',
    );
  });

  it('generates a header with add-on name and version count when versions have loaded', async () => {
    const name = 'My addon';
    const addon = {
      ...fakeAddon,
      name: createLocalizedString(name),
      slug: defaultSlug,
    };
    const versions = [fakeVersion];
    const expectedHeader = `${name} version history - ${versions.length} version`;

    _loadAddon(addon);
    _loadVersions({ versions });

    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(expectedHeader),
    );
    expect(
      screen.getByRole('heading', { name: expectedHeader }),
    ).toBeInTheDocument();
  });

  it('generates a header for multiple versions', async () => {
    const name = 'My addon';
    const addon = {
      ...fakeAddon,
      name: createLocalizedString(name),
      slug: defaultSlug,
    };
    const versions = [fakeVersion, fakeVersion];
    const expectedHeader = `${name} version history - ${versions.length} versions`;

    _loadAddon(addon);
    _loadVersions({ versions });

    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(expectedHeader),
    );
  });

  it('passes an add-on to the AddonSummaryCard', () => {
    _loadAddon();
    render();

    expect(screen.getByAltText('Add-on icon')).toHaveAttribute(
      'src',
      fakeAddon.icon_url,
    );
  });

  it('passes a LoadingText component to the CardList header if the header is blank', () => {
    render();

    expect(
      within(
        within(screen.getByClassName('CardList')).getByClassName(
          'Card-header-text',
        ),
      ).getByRole('alert'),
    ).toBeInTheDocument();
  });

  it('passes the errorHandler and isAddonInstallPage to the Page component', () => {
    dispatchClientMetadata({ store, userAgent: userAgents.chrome[0] });
    const message = 'Some error message';
    createFailedErrorHandler({
      id: getErrorHandlerId(),
      message,
      store,
    });

    render();

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByText('download Firefox')).not.toBeInTheDocument();
  });

  // This also tests a lot of the functionality in AddonVersionCard
  it('passes the first found version into the AddonVersionCard', () => {
    const app = 'testApp';
    const created = '1967-02-19T10:09:01Z';
    const i18n = fakeI18n();
    const licenseName = 'some license name';
    const licenseURL = 'http://example.com/';
    const max = '2.0';
    const min = '1.0';
    const releaseNotes = 'Some release notes';
    const size = 12345;
    const versionNumber = '1.0';
    const version1 = {
      ...fakeVersion,
      compatibility: {
        [app]: {
          min,
          max,
        },
      },
      file: { ...fakeFile, created, size },
      id: 1,
      license: {
        ...fakeVersion.license,
        name: createLocalizedString(licenseName),
        url: licenseURL,
      },
      release_notes: createLocalizedString(releaseNotes),
      version: versionNumber,
    };
    const addon = {
      ...fakeAddon,
      slug: defaultSlug,
      current_version: version1,
    };
    const version2 = { ...fakeVersion, id: 2 };

    _loadAddon(addon);
    _loadVersions({ versions: [version1, version2] });

    render();

    const latestVersionCard = allVersionCards()[0];
    expect(
      within(latestVersionCard).getByRole('heading', {
        name: `Version ${versionNumber}`,
      }),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByText(`Works with ${app} ${min} to ${max}`),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByText(
        `Released ${i18n.moment(created).format('ll')} - ${formatFilesize({
          i18n,
          size,
        })}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByText(releaseNotes),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByTextAcrossTags(
        `Source code released under ${licenseName}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(latestVersionCard).getByRole('link', { name: licenseName }),
    ).toHaveAttribute('href', licenseURL);
  });

  // TODO: Note to remove this test when tests for AddonVersionCard are added,
  // as it will be redundant.
  it('passes null for the version when versions have been loaded, but there are no versions', () => {
    _loadAddon();
    _loadVersions({ versions: [] });

    render();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'No version found',
    );
  });

  it('passes the correct versions into multiple AddonVersionCards', () => {
    const version1 = { ...fakeVersion, id: 1, version: '1.0' };
    const addon = {
      ...fakeAddon,
      slug: defaultSlug,
      current_version: version1,
    };
    const version2 = { ...fakeVersion, id: 2, version: '2.0' };
    const version3 = { ...fakeVersion, id: 3, version: '3.0' };

    _loadAddon(addon);
    _loadVersions({ versions: [version1, version2, version3] });

    render();

    const versionCards = allVersionCards();
    expect(versionCards).toHaveLength(3);
    expect(
      within(versionCards[0]).getByText('Version 1.0'),
    ).toBeInTheDocument();
    expect(
      within(versionCards[1]).getByText('Version 2.0'),
    ).toBeInTheDocument();
    expect(
      within(versionCards[2]).getByText('Version 3.0'),
    ).toBeInTheDocument();
  });

  it('displays expected headings for latest and older versions', () => {
    const version1 = { ...fakeVersion, id: 1 };
    const addon = {
      ...fakeAddon,
      slug: defaultSlug,
      current_version: version1,
    };
    const version2 = { ...fakeVersion, id: 2 };
    const version3 = { ...fakeVersion, id: 3 };
    const version4 = { ...fakeVersion, id: 4 };

    _loadAddon(addon);
    _loadVersions({ versions: [version1, version2, version3, version4] });

    render();

    const versionCards = allVersionCards();

    expect(
      within(versionCards[0]).getByRole('heading', {
        name: 'Latest version',
      }),
    ).toBeInTheDocument();
    expect(
      within(versionCards[1]).getByRole('heading', {
        name: 'Older versions',
      }),
    ).toBeInTheDocument();
    expect(
      within(versionCards[1]).queryByRole('heading', {
        name: 'Latest version',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(versionCards[2]).queryByRole('heading', {
        name: 'Older versions',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(versionCards[2]).queryByRole('heading', {
        name: 'Latest version',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(versionCards[3]).queryByRole('heading', {
        name: 'Older versions',
      }),
    ).not.toBeInTheDocument();
    expect(
      within(versionCards[3]).queryByRole('heading', {
        name: 'Latest version',
      }),
    ).not.toBeInTheDocument();
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the slug prop and page query param', () => {
      const page = 19;
      const slug = 'some-addon-slug';
      expect(
        extractId({
          location: { query: { page } },
          match: { params: { slug } },
        }),
      ).toEqual(`${slug}-${page}`);
    });

    it('returns a unique ID provided by just the slug if there is no page query param', () => {
      const slug = 'some-addon-slug';
      expect(
        extractId({
          location: { query: {} },
          match: { params: { slug } },
        }),
      ).toEqual(`${slug}-`);
    });
  });
});
