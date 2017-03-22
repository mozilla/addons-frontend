import React from 'react';
import ReactDOM from 'react-dom';
import { renderIntoDocument } from 'react-addons-test-utils';

import { getFakeI18nInst } from 'tests/client/helpers';
import LoadingIndicator from 'ui/components/LoadingIndicator';


describe('<LoadingIndicator />', () => {
  function render(props) {
    return renderIntoDocument(
      <LoadingIndicator i18n={getFakeI18nInst()} {...props} />
    );
  }

  it('renders altText', () => {
    const root = render({ altText: <div className="test">hello</div> });
    const rootNode = ReactDOM.findDOMNode(root);

    assert.equal(rootNode.textContent, 'hello');
  });

  it('renders "Loading" by default', () => {
    const root = render();
    const rootNode = ReactDOM.findDOMNode(root);

    assert.equal(rootNode.textContent, 'Loading…');
  });
});
