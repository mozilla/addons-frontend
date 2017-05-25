import React from 'react';
import ReactDOM from 'react-dom';
import { renderIntoDocument } from 'react-addons-test-utils';

import LoadingText from 'ui/components/LoadingText';


describe('<LoadingText />', () => {
  function render() {
    return renderIntoDocument(
      <LoadingText />
    );
  }

  it('renders LoadingText element with className', () => {
    const root = render();
    const rootNode = ReactDOM.findDOMNode(root);

    assert.include(rootNode.className, 'LoadingText');
  });
});
