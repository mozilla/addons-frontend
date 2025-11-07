import { LOCATION_CHANGE } from 'redux-first-history';
import { waitFor } from '@testing-library/react';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import {
  REASON_ADDON_DELETED,
  REASON_VERSION_DELETED,
  extractId,
} from 'amo/pages/Block';
import {
  FETCH_BLOCK,
  abortFetchBlock,
  fetchBlock,
  loadBlock,
} from 'amo/reducers/blocks';
import { createApiError } from 'amo/api';
import {
  createFailedErrorHandler,
  createFakeBlockResult,
  createLocalizedString,
  dispatchClientMetadata,
  getElement,
  renderPage as defaultRender,
  screen,
  within,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const clientApp = CLIENT_APP_FIREFOX;
  const defaultGuid = 'someGuid';
  const lang = 'en-US';
  const getErrorHandlerId = (guid = defaultGuid) =>
    `src/amo/pages/Block/index.js-${guid}`;
  const getLocation = (guid = defaultGuid) =>
    `/${lang}/${clientApp}/blocked-addon/${guid}/`;
  let store;

  beforeEach(() => {
    store = dispatchClientMetadata({ clientApp, lang }).store;
  });

  const render = ({ guid = defaultGuid } = {}) =>
    defaultRender({
      initialEntries: [getLocation(guid)],
      store,
    });

  const _createFakeBlockResult = ({ guid = defaultGuid, ...props } = {}) =>
    createFakeBlockResult({ guid, ...props });

  it('dispatches fetchBlock when block is undefined', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith(
      fetchBlock({ guid: defaultGuid, errorHandlerId: getErrorHandlerId() }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: LOCATION_CHANGE }),
    );
  });

  it('does not fetch a block if it has already been loaded', () => {
    const block = _createFakeBlockResult();
    store.dispatch(loadBlock({ block }));
    const dispatch = jest.spyOn(store, 'dispatch');
    render();

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_BLOCK }),
    );
  });

  it('does not fetch a block if fetch was aborted', () => {
    store.dispatch(abortFetchBlock({ guid: defaultGuid }));
    const dispatch = jest.spyOn(store, 'dispatch');

    render();
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: FETCH_BLOCK }),
    );
  });

  it('fetches a block if it has not already been loaded', () => {
    const guid1 = 'some-guid-already-loaded';
    const guid2 = 'some-guid-not-loaded-yet';
    const block1 = _createFakeBlockResult({ guid: guid1 });
    // We load the block with `guid-1`.
    store.dispatch(loadBlock({ block: block1 }));
    const dispatch = jest.spyOn(store, 'dispatch');

    // We want to render the page with `guid-2`.
    render({ guid: guid2 });

    expect(dispatch).toHaveBeenCalledWith(
      fetchBlock({ guid: guid2, errorHandlerId: getErrorHandlerId(guid2) }),
    );
  });

  it('renders a NotFoundPage when the block was not found', () => {
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 404 },
      }),
      id: getErrorHandlerId(),
      store,
    });
    render();

    expect(
      screen.getByText('Oops! We can’t find that page'),
    ).toBeInTheDocument();
  });

  it('renders a ServerErrorPage when there is a non-404 error', () => {
    createFailedErrorHandler({
      error: createApiError({
        response: { status: 500 },
      }),
      id: getErrorHandlerId(),
      store,
    });
    render();

    expect(screen.getByText('Server Error')).toBeInTheDocument();
  });

  it('renders a page with loading indicators when a block has not been loaded yet', () => {
    render();

    expect(
      within(screen.getByClassName('Block-reason')).getAllByRole('alert'),
    ).toHaveLength(1);
    expect(
      within(screen.getByClassName('Block-metadata')).getAllByRole('alert'),
    ).toHaveLength(1);
  });

  it('renders a generic header/title when the block has no add-on name', async () => {
    const block = _createFakeBlockResult({ addonName: null });
    const title = 'This add-on is blocked for violating Mozilla policies';
    store.dispatch(loadBlock({ block }));
    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `${title} – Add-ons for Firefox (${lang})`,
      ),
    );
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders the name of the add-on in the title/header when the block has one', async () => {
    const name = 'some-addon-name';
    const block = _createFakeBlockResult({
      addonName: createLocalizedString(name),
    });
    const title = `${name} is blocked for violating Mozilla policies`;
    store.dispatch(loadBlock({ block }));
    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `${title} – Add-ons for Firefox (${lang})`,
      ),
    );

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders a generic soft-block header/title when the block has no add-on name', async () => {
    const block = _createFakeBlockResult({
      addonName: null,
      soft_blocked: ['42.0'],
      blocked: [],
    });
    const title = 'This add-on is restricted for violating Mozilla policies';
    store.dispatch(loadBlock({ block }));
    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `${title} – Add-ons for Firefox (${lang})`,
      ),
    );
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders a paragraph with the reason when the block has one', () => {
    const reason = 'this is a reason for a block';
    const block = _createFakeBlockResult({ reason });
    store.dispatch(loadBlock({ block }));
    render();

    expect(screen.getByText(reason)).toBeInTheDocument();
    expect(screen.getByText(reason)).toHaveAttribute('lang', 'en-US');
  });

  it('does not render a reason if the block does not have one', () => {
    const block = _createFakeBlockResult({ reason: null });
    store.dispatch(loadBlock({ block }));
    render();

    expect(screen.queryByClassName('Block-reason')).not.toBeInTheDocument();
  });

  it('does not render a reason if the reason is an empty string', () => {
    const block = _createFakeBlockResult({ reason: '' });
    store.dispatch(loadBlock({ block }));
    render();

    expect(screen.queryByClassName('Block-reason')).not.toBeInTheDocument();
  });

  it('renders the reason with HTML tags removed', () => {
    const reason = 'this is a <a>reason for a block</a>';
    const block = _createFakeBlockResult({ reason });
    store.dispatch(loadBlock({ block }));
    render();

    expect(
      screen.getByText('this is a reason for a block'),
    ).toBeInTheDocument();
  });

  it('renders the block URL if there is one', () => {
    const url = {
      url: 'http://example.org/block/reason/maybe',
      outgoing: 'https://outgoing.mozilla.org/bbb',
    };
    const block = _createFakeBlockResult({ url });
    store.dispatch(loadBlock({ block }));
    render();

    expect(screen.getByTitle(url.url)).toHaveAttribute('href', url.outgoing);
  });

  it('does not render any link when there is no block URL', () => {
    const block = _createFakeBlockResult({ url: null });
    store.dispatch(loadBlock({ block }));
    render();

    expect(
      // eslint-disable-next-line testing-library/prefer-presence-queries
      within(screen.getByClassName('Block-metadata')).queryByRole('link'),
    ).not.toBeInTheDocument();
  });

  it('renders a robots meta tag', async () => {
    render();

    await waitFor(() =>
      expect(getElement('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, follow',
      ),
    );
  });

  it('renders a block page when a versionId is present in the URL', () => {
    const name = 'some-addon-name';
    const block = _createFakeBlockResult({
      addonName: createLocalizedString(name),
    });
    store.dispatch(loadBlock({ block }));

    defaultRender({
      initialEntries: [`${getLocation()}someVersionId/`],
      store,
    });

    expect(
      screen.getByText(`${name} is blocked for violating Mozilla policies`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /It will be automatically disabled and no longer usable in Firefox./,
      ),
    ).toBeInTheDocument();
  });

  it('renders a soft-block page when the block has only soft-blocks', () => {
    const name = 'some-addon-name';
    const block = _createFakeBlockResult({
      addonName: createLocalizedString(name),
      soft_blocked: ['42.0'],
      blocked: [],
    });
    store.dispatch(loadBlock({ block }));

    render();

    expect(
      screen.getByText(`${name} is restricted for violating Mozilla policies`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /They may choose to enable the add-on again at their own risk./,
      ),
    ).toBeInTheDocument();
  });

  it('renders a soft-block page when a soft-blocked versionId is present in the URL', () => {
    const name = 'some-addon-name';
    const block = _createFakeBlockResult({
      addonName: createLocalizedString(name),
      soft_blocked: ['42.0'],
    });
    store.dispatch(loadBlock({ block }));

    defaultRender({
      initialEntries: [`${getLocation()}42.0/`],
      store,
    });

    expect(
      screen.getByText(`${name} is restricted for violating Mozilla policies`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /They may choose to enable the add-on again at their own risk./,
      ),
    ).toBeInTheDocument();
  });

  describe('extractId', () => {
    it('returns a unique ID based on the GUID', () => {
      const guid = 'this-is-not-a-guid';
      const ownProps = {
        match: {
          params: { guid },
        },
      };

      expect(extractId(ownProps)).toEqual(guid);
    });
  });

  it('renders a different content when the soft-block is for a deleted add-on', () => {
    const name = 'some-addon-name';
    const block = _createFakeBlockResult({
      addonName: createLocalizedString(name),
      soft_blocked: ['42.0'],
      blocked: [],
      reason: REASON_ADDON_DELETED,
    });
    store.dispatch(loadBlock({ block }));

    render();

    expect(
      screen.getByText(
        `${name} is restricted because it was deleted by the author(s)`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/When an add-on is deleted/)).toBeInTheDocument();
    expect(
      screen.getByText(/Why does Mozilla restrict deleted add-ons/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The version of this extension, theme, or plugin was deleted by the author/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByClassName('Block-reason')).not.toBeInTheDocument();
  });

  it('renders a different content when the soft-block is for a deleted version', () => {
    const name = 'some-addon-name';
    const block = _createFakeBlockResult({
      addonName: createLocalizedString(name),
      soft_blocked: ['42.0'],
      blocked: [],
      reason: REASON_VERSION_DELETED,
    });
    store.dispatch(loadBlock({ block }));

    render();

    expect(
      screen.getByText(
        `${name} is restricted because it was deleted by the author(s)`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/When an add-on is deleted/)).toBeInTheDocument();
    expect(
      screen.getByText(/Why does Mozilla restrict deleted add-ons/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The version of this extension, theme, or plugin was deleted by the author/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByClassName('Block-reason')).not.toBeInTheDocument();
  });

  it('renders a generic header/title when the block has no add-on name for a deleted version', async () => {
    const block = _createFakeBlockResult({
      soft_blocked: ['42.0'],
      blocked: [],
      addonName: null,
      reason: REASON_VERSION_DELETED,
    });
    const title =
      'This add-on is restricted because it was deleted by the author(s)';
    store.dispatch(loadBlock({ block }));
    render();

    await waitFor(() =>
      expect(getElement('title')).toHaveTextContent(
        `${title} – Add-ons for Firefox (${lang})`,
      ),
    );
    expect(screen.getByText(title)).toBeInTheDocument();
  });
});
