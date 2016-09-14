import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import AdminSearchResult from 'admin/components/SearchResult';

describe('<AdminSearchResult />', () => {
  const result = {
    name: 'A search result',
    type: 'Extension',
    slug: 'a-search-result',
    status: 'Fully Reviewed',
    current_version: {
      files: [{}, {}],
    },
  };
  const root = renderIntoDocument(<AdminSearchResult result={result} />);

  it('renders the name', () => {
    assert.equal(root.name.props.children, 'A search result');
  });

  it('renders the type', () => {
    assert.equal(root.type.textContent, 'Extension');
  });

  it('renders the status', () => {
    assert.equal(root.status.textContent, 'Fully Reviewed');
  });

  it('renders the number of files', () => {
    assert.equal(root.fileCount.textContent, '2 files');
  });

  it('outputs zero if no files exist', () => {
    const thisResult = { ...result, current_version: { } };
    const thisRoot = renderIntoDocument(
      <AdminSearchResult result={thisResult} />);
    assert.equal(thisRoot.fileCount.textContent, '0 files');
  });

  it('links to the detail page', () => {
    assert.equal(root.name.props.to, '/search/addons/a-search-result');
  });

  it('renders the number of files singularly', () => {
    const thisResult = { ...result, current_version: { files: [{}] } };
    const thisRoot = renderIntoDocument(
      <AdminSearchResult result={thisResult} />);
    assert.equal(thisRoot.fileCount.textContent, '1 file');
  });
});
