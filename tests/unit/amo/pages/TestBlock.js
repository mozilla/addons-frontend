import { LOCATION_CHANGE } from 'redux-first-history';
import { waitFor } from '@testing-library/react';

import { CLIENT_APP_FIREFOX } from 'amo/constants';
import { extractId } from 'amo/pages/Block';
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
  fakeI18n,
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
    // 1. versions blocked
    // 2. date and URL
    expect(
      within(screen.getByClassName('Block-metadata')).getAllByRole('alert'),
    ).toHaveLength(2);
  });

  it('renders a generic header/title when the block has no add-on name', async () => {
    const block = _createFakeBlockResult({ addonName: null });
    const title = 'This add-on has been blocked for your protection.';
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
    const title = `${name} has been blocked for your protection.`;
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
  });

  it('does not render a reason if the block does not have one', () => {
    const block = _createFakeBlockResult({ reason: null });
    store.dispatch(loadBlock({ block }));
    render();

    expect(screen.queryByClassName('Block-reason')).not.toBeInTheDocument();
  });

  it('renders "all versions" when "is_all_versions" is true', () => {
    const block = _createFakeBlockResult({
      is_all_versions: true,
    });
    const jed = fakeI18n();
    store.dispatch(loadBlock({ block }));
    render();

    // The version info and the block date are inside the same tag, separated
    // by a </br>.
    expect(
      screen.getByTextAcrossTags(
        `Versions blocked: all versions.Blocked on ${jed
          .moment(block.created)
          .format('ll')}.`,
      ),
    ).toBeInTheDocument();
  });

  it('renders the versions if "is_all_versions" is false', () => {
    const v1 = '12';
    const v2 = '34';
    const block = _createFakeBlockResult({
      versions: [v1, v2],
      is_all_versions: false,
    });
    const jed = fakeI18n();
    store.dispatch(loadBlock({ block }));
    render();

    // The version info and the block date are inside the same tag, separated
    // by a </br>.
    expect(
      screen.getByTextAcrossTags(
        `Versions blocked: ${v1}, ${v2}.Blocked on ${jed
          .moment(block.created)
          .format('ll')}.`,
      ),
    ).toBeInTheDocument();
  });

  it('renders the versions if "is_all_versions" is missing', () => {
    const v1 = '12';
    const v2 = '34';
    const block = _createFakeBlockResult({
      versions: [v1, v2],
      is_all_versions: undefined,
    });
    const jed = fakeI18n();
    store.dispatch(loadBlock({ block }));
    render();

    // The version info and the block date are inside the same tag, separated
    // by a </br>.
    expect(
      screen.getByTextAcrossTags(
        `Versions blocked: ${v1}, ${v2}.Blocked on ${jed
          .moment(block.created)
          .format('ll')}.`,
      ),
    ).toBeInTheDocument();
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
      screen.getByText(`${name} has been blocked for your protection.`),
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
});
