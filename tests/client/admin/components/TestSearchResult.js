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
  const root = renderIntoDocument(<AdminSearchResult addon={result} />);

  it('renders the name', () => {
    expect(root.name.props.children).toEqual('A search result');
  });

  it('renders the type', () => {
    expect(root.type.textContent).toEqual('Extension');
  });

  it('renders the status', () => {
    expect(root.status.textContent).toEqual('Fully Reviewed');
  });

  it('renders the number of files', () => {
    expect(root.fileCount.textContent).toEqual('2 files');
  });

  it('outputs zero if no files exist', () => {
    const thisResult = { ...result, current_version: { } };
    const thisRoot = renderIntoDocument(
      <AdminSearchResult addon={thisResult} />);
    expect(thisRoot.fileCount.textContent).toEqual('0 files');
  });

  it('links to the detail page', () => {
    expect(root.name.props.to).toEqual('/search/addons/a-search-result');
  });

  it('renders the number of files singularly', () => {
    const thisResult = { ...result, current_version: { files: [{}] } };
    const thisRoot = renderIntoDocument(
      <AdminSearchResult addon={thisResult} />);
    expect(thisRoot.fileCount.textContent).toEqual('1 file');
  });
});
