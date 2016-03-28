import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import AppView from 'disco/components/hello-world';

describe('disco <AppView />', () => {
  it('is just a hello world', () => {
    const root = renderIntoDocument(<AppView />);
    assert.equal(root.refs.container.textContent, 'HELLO DISCO WORLD');
  });
});
