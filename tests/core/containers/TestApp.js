import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import App from 'core/containers/App';

describe('core <App />', () => {
  it('has a list of apps', () => {
    const root = renderIntoDocument(<App />);
    const list = root.refs.appList;
    assert.equal(list.tagName, 'UL');
    assert.equal(list.childNodes.length, 2);
    assert.equal(list.childNodes[0].textContent, 'Search');
    assert.equal(list.childNodes[1].textContent, 'Discovery Pane');
  });
});
