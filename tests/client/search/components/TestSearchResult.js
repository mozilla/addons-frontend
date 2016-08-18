import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import SearchResult from 'search/components/SearchResult';

describe('<SearchResult />', () => {
  const result = {
    name: 'A search result',
    type: 'Extension',
    slug: 'a-search-result',
    status: 'Fully Reviewed',
    current_version: {
      files: [{}, {}],
    },
  };
  const root = renderIntoDocument(<SearchResult result={result} />);

  it('renders the name', () => {
    assert.equal(root.refs.name.textContent, 'A search result');
  });

  it('renders the type', () => {
    assert.equal(root.refs.type.textContent, 'Extension');
  });

  it('renders the status', () => {
    assert.equal(root.refs.status.textContent, 'Fully Reviewed');
  });

  it('renders the number of files', () => {
    assert.equal(root.refs.fileCount.textContent, '2 files');
  });

  it('links to the detail page', () => {
    assert.equal(root.refs.container.props.to, '/search/addons/a-search-result');
  });

  it('renders the number of files singularly', () => {
    const thisResult = { ...result, current_version: { files: [{}] } };
    const thisRoot = renderIntoDocument(<SearchResult result={thisResult} />);
    assert.equal(thisRoot.refs.fileCount.textContent, '1 file');
  });
});
