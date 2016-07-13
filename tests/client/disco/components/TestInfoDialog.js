import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import ReactDOM, { findDOMNode } from 'react-dom';

import InfoDialog from 'disco/components/InfoDialog';
import I18nProvider from 'core/i18n/Provider';

import { getFakeI18nInst } from 'tests/client/helpers';


let closeAction;

function getInfoDialog(props = {}) {
  closeAction = sinon.stub();
  const renderProps = {
    addonName: 'A Test Add-on',
    imageURL: 'https://addons-dev-cdn.allizom.org/whatever',
    closeAction,
    ...props,
  };
  return <InfoDialog {...renderProps} />;
}

describe('<InfoDialog />', () => {
  function renderInfoDialog(props = {}) {
    return renderIntoDocument(
      <I18nProvider i18n={getFakeI18nInst()}>
        {getInfoDialog(props)}
      </I18nProvider>);
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


describe('Clicking outside <InfoDialog />', () => {
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
          <I18nProvider i18n={getFakeI18nInst()}>
            <div>
              {getInfoDialog()}
              <div ref="outsideComponent" onClick={(e) => e.stopPropagation()} />
            </div>
          </I18nProvider>
        );
      }
    }

    const rootComponent = ReactDOM.render(<FakeContainer />, mountNode);
    const outsideNode = rootComponent.refs.outsideComponent;
    simulateClick(outsideNode);
    assert.ok(closeAction.called, 'closeAction stub was called');
  });
});
