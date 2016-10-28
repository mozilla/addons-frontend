import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';

import { AppBase, mapStateToProps } from 'disco/containers/App';
import { getFakeI18nInst } from 'tests/client/helpers';

class MyComponent extends React.Component {
  render() {
    return <p>The component</p>;
  }
}

function renderApp(extraProps = {}) {
  const props = {
    browserVersion: '50',
    i18n: getFakeI18nInst(),
    ...extraProps,
  };
  const root = findRenderedComponentWithType(renderIntoDocument(
    <AppBase {...props}>
      <MyComponent />
    </AppBase>
  ), AppBase);
  return findDOMNode(root);
}

describe('App', () => {
  it('renders its children', () => {
    const rootNode = renderApp();
    assert.equal(rootNode.tagName.toLowerCase(), 'div');
    assert.equal(rootNode.querySelector('p').textContent, 'The component');
  });

  it('renders padding compensation class for FF < 50', () => {
    const rootNode = renderApp({ browserVersion: '49.0' });
    assert.include(rootNode.className, 'padding-compensation');
  });

  it('does not render padding compensation class for a bogus value', () => {
    const rootNode = renderApp({ browserVersion: 'whatever' });
    assert.notInclude(rootNode.className, 'padding-compensation');
  });

  it('does not render padding compensation class for a undefined value', () => {
    const rootNode = renderApp({ browserVersion: undefined });
    assert.notInclude(rootNode.className, 'padding-compensation');
  });

  it('does not render padding compensation class for FF == 50', () => {
    const rootNode = renderApp({ browserVersion: '50.0' });
    assert.notInclude(rootNode.className, 'padding-compensation');
  });

  it('does not render padding compensation class for FF > 50', () => {
    const rootNode = renderApp({ browserVersion: '52.0a1' });
    assert.notInclude(rootNode.className, 'padding-compensation');
  });
});

describe('mapStateToProps', () => {
  const fakeRouterParams = {
    params: {
      version: '49.0',
    },
  };

  it('returns browserVersion', () => {
    assert.equal(mapStateToProps(null, fakeRouterParams).browserVersion, '49.0');
  });
});
