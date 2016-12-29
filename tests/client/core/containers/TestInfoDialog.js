/* global document */

import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import ReactDOM, { findDOMNode } from 'react-dom';

import { InfoDialogBase, ShowInfoDialog, mapStateToProps } from 'core/containers/InfoDialog';
import { getFakeI18nInst, shallowRender } from 'tests/client/helpers';


let closeAction;

function getInfoDialog(props = {}) {
  closeAction = sinon.stub();
  const renderProps = {
    addonName: 'A Test Add-on',
    imageURL: 'https://addons-dev-cdn.allizom.org/whatever',
    closeAction,
    i18n: getFakeI18nInst(),
    ...props,
  };
  return <InfoDialogBase {...renderProps} />;
}

describe('<InfoDialogBase />', () => {
  function renderInfoDialog(props = {}) {
    return renderIntoDocument(getInfoDialog(props));
  }

  it('Should render a dialog with aria role', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    assert.equal(root.getAttribute('role'), 'dialog');
  });

  it('Should render a title', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    assert.equal(root.querySelector('#show-info-title').textContent, 'Your add-on is ready');
  });

  it('Should render a description containing the add-on name', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    assert.include(root.querySelector('#show-info-description').textContent, 'A Test Add-on');
  });

  it('should have an img element with a src', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    assert.ok(root.querySelector('img').src, 'https://addons-dev-cdn.allizom.org/whatever');
  });

  it('should call closeAction func when clicking close', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    Simulate.click(root.querySelector('button'));
    assert.ok(closeAction.called, 'closeAction stub was called');
  });
});


describe('Clicking outside <InfoDialogBase />', () => {
  let mountNode;

  function simulateClick(node) {
    const event = document.createEvent('Event');
    event.initEvent('mousedown', true, true);
    node.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    mountNode = document.createElement('div');
    document.body.appendChild(mountNode);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(mountNode);
    document.body.removeChild(mountNode);
  });

  it('should call closeAction func when clicking outside', () => {
    class FakeContainer extends React.Component {
      render() {
        return (
          <div>
            {getInfoDialog()}
            <button id="outside-component" onClick={(e) => e.stopPropagation()} />
          </div>
        );
      }
    }

    ReactDOM.render(<FakeContainer />, mountNode);
    const outsideNode = document.getElementById('outside-component');
    simulateClick(outsideNode);
    assert.ok(closeAction.called, 'closeAction stub was called');
  });
});

describe('<ShowInfoDialog />', () => {
  it('renders InfoDialogBase when it is told to', () => {
    const data = { some: 'data' };
    const root = shallowRender(<ShowInfoDialog data={data} show />);
    assert.equal(root.type, InfoDialogBase);
    assert.deepEqual(root.props, data);
  });

  it('does not render InfoDialogBase when not told to', () => {
    const root = shallowRender(<ShowInfoDialog show={false} />);
    assert.equal(root, null);
  });

  it('mapStateToProps pulls infoDialog state', () => {
    const infoDialog = { infoDialogState: 'you bet' };
    assert.strictEqual(mapStateToProps({ addons: [], infoDialog }), infoDialog);
  });
});
