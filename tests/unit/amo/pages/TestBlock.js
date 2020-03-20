/* eslint camelcase: 0 */
import * as React from 'react';

import Block, { extractId, BlockBase } from 'amo/pages/Block';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import { abortFetchBlock, fetchBlock, loadBlock } from 'amo/reducers/blocks';
import {
  createFakeBlockResult,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({ guid = 'some-guid', ...props } = {}) => {
    const allProps = {
      store: dispatchClientMetadata().store,
      i18n: fakeI18n(),
      match: {
        params: {
          guid,
        },
      },
      ...props,
    };

    return shallowUntilTarget(<Block {...allProps} />, BlockBase);
  };

  it('dispatches fetchBlock when block is undefined', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');
    const errorHandler = createStubErrorHandler();
    const guid = 'some-guid';

    render({ errorHandler, store, guid });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchBlock({ guid, errorHandlerId: errorHandler.id }),
    );

    sinon.assert.calledOnce(dispatchSpy);
  });

  it('does not fetch a block if it has already been loaded', () => {
    const guid = 'some-guid';
    const block = createFakeBlockResult({ guid });
    const { store } = dispatchClientMetadata();
    store.dispatch(loadBlock({ block }));
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ store, guid });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('does not fetch a block if fetch was aborted', () => {
    const guid = 'some-guid';
    const { store } = dispatchClientMetadata();
    store.dispatch(abortFetchBlock({ guid }));
    const dispatchSpy = sinon.spy(store, 'dispatch');

    render({ store, guid });

    sinon.assert.notCalled(dispatchSpy);
  });

  it('fetches a block if it has not already been loaded', () => {
    const guid1 = 'some-guid-already-loaded';
    const guid2 = 'some-guid-not-loaded-yet';
    const block1 = createFakeBlockResult({ guid: guid1 });
    const errorHandler = createStubErrorHandler();
    const { store } = dispatchClientMetadata();
    // We load the block with `guid-1`.
    store.dispatch(loadBlock({ block: block1 }));
    const dispatchSpy = sinon.spy(store, 'dispatch');

    // We want to render the page with `guid-2`.
    render({ errorHandler, store, guid: guid2 });

    sinon.assert.calledWith(
      dispatchSpy,
      fetchBlock({ guid: guid2, errorHandlerId: errorHandler.id }),
    );

    sinon.assert.calledOnce(dispatchSpy);
  });

  it('renders a NotFoundPage when the block was not found', () => {
    const guid = 'some-guid';
    const { store } = dispatchClientMetadata();
    store.dispatch(abortFetchBlock({ guid }));

    const root = render({ store, guid });

    expect(root.find(NotFoundPage)).toHaveLength(1);
  });

  it('renders a page with loading indicators when a block has not been loaded yet', () => {
    const partialTitle = 'This add-on has been';

    const root = render();

    expect(root.find(Page)).toHaveLength(1);
    expect(root.find('title')).toIncludeText(partialTitle);
    expect(root.find(Card)).toHaveLength(1);
    expect(root.find(Card)).toHaveProp(
      'header',
      expect.stringMatching(partialTitle),
    );
    expect(root.find(LoadingText)).toHaveLength(3);
    expect(root.find('.Block-reason').find(LoadingText)).toHaveLength(1);
    // 1. versions blocked
    // 2. date and URL
    expect(root.find('.Block-metadata').find(LoadingText)).toHaveLength(2);
  });

  it('renders a paragraph with the reason when the block has one', () => {
    const guid = 'some-guid';
    const reason = 'this is a reason for a block';
    const block = createFakeBlockResult({ guid, reason });
    const { store } = dispatchClientMetadata();
    store.dispatch(loadBlock({ block }));

    const root = render({ store, guid });

    expect(root.find('.Block-reason')).toHaveLength(1);
    expect(root.find('.Block-reason')).toHaveText(reason);
  });

  it('does not render a reason if the block does not have one', () => {
    const guid = 'some-guid';
    const reason = null;
    const block = createFakeBlockResult({ guid, reason });
    const { store } = dispatchClientMetadata();
    store.dispatch(loadBlock({ block }));

    const root = render({ store, guid });

    expect(root.find('.Block-reason')).toHaveLength(0);
  });

  it('renders the min/max versions', () => {
    const guid = 'some-guid';
    const min_version = '12';
    const max_version = '34';
    const block = createFakeBlockResult({ guid, min_version, max_version });
    const { store } = dispatchClientMetadata();
    store.dispatch(loadBlock({ block }));

    const root = render({ store, guid });

    expect(root.find('.Block-metadata')).toIncludeText(
      `Versions blocked: ${min_version} to ${max_version}`,
    );
  });

  it('renders the block date', () => {
    const guid = 'some-guid';
    const created = '2020-01-29T11:10:02Z';
    const block = createFakeBlockResult({ guid, created });
    const { store } = dispatchClientMetadata();
    store.dispatch(loadBlock({ block }));
    const i18n = fakeI18n();

    const root = render({ store, guid });

    expect(root.find('.Block-metadata')).toIncludeText(
      `Blocked on ${i18n.moment(created).format('ll')}`,
    );
  });

  it('renders the block URL if there is one', () => {
    const guid = 'some-guid';
    const url = 'http://example.org/block/reason/maybe';
    const block = createFakeBlockResult({ guid, url });
    const { store } = dispatchClientMetadata();
    store.dispatch(loadBlock({ block }));

    const root = render({ store, guid });

    expect(root.find('.Block-metadata').html()).toContain(
      `<a href="${url}">View block request</a>.`,
    );
  });

  it('does not render any link when there is no block URL', () => {
    const guid = 'some-guid';
    const url = null;
    const block = createFakeBlockResult({ guid, url });
    const { store } = dispatchClientMetadata();
    store.dispatch(loadBlock({ block }));

    const root = render({ store, guid });

    expect(root.find('.Block-metadata')).not.toIncludeText(
      'View block request',
    );
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
