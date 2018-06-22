/* global document */
import { shallow } from 'enzyme';
import * as React from 'react';
import { Simulate, renderIntoDocument } from 'react-dom/test-utils';
import ReactDOM, { findDOMNode } from 'react-dom';

import {
  InfoDialogBase,
  ShowInfoDialog,
  mapStateToProps,
} from 'core/containers/InfoDialog';
import { fakeI18n } from 'tests/unit/helpers';

let closeAction;

function getInfoDialog(props = {}) {
  closeAction = sinon.stub();
  const renderProps = {
    addonName: 'A Test Add-on',
    imageURL: 'https://addons-dev-cdn.allizom.org/whatever',
    closeAction,
    i18n: fakeI18n(),
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
    expect(root.getAttribute('role')).toEqual('dialog');
  });

  it('Should render a title', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    expect(root.querySelector('#show-info-title').textContent).toEqual(
      'Your add-on is ready',
    );
  });

  it('Should render a description containing the add-on name', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    expect(root.querySelector('#show-info-description').textContent).toContain(
      'A Test Add-on',
    );
  });

  it('should have an img element with a src', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    expect(root.querySelector('img').src).toBeTruthy();
  });

  it('should call closeAction func when clicking close', () => {
    const dialog = renderInfoDialog();
    const root = findDOMNode(dialog);
    Simulate.click(root.querySelector('button'));
    expect(closeAction.called).toBeTruthy();
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
            <button
              id="outside-component"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      }
    }

    ReactDOM.render(<FakeContainer />, mountNode);
    const outsideNode = document.getElementById('outside-component');
    simulateClick(outsideNode);
    expect(closeAction.called).toBeTruthy();
  });
});

describe('<ShowInfoDialog />', () => {
  it('renders InfoDialogBase when it is told to', () => {
    const data = { some: 'data' };
    const root = shallow(<ShowInfoDialog data={data} show />);
    expect(root.type()).toEqual(InfoDialogBase);
    expect(root.props()).toEqual(data);
  });

  it('does not render InfoDialogBase when not told to', () => {
    const root = shallow(<ShowInfoDialog show={false} />);
    expect(root.type()).toEqual(null);
  });

  it('mapStateToProps pulls infoDialog state', () => {
    const infoDialog = { infoDialogState: 'you bet' };
    expect(mapStateToProps({ addons: [], infoDialog })).toEqual(infoDialog);
  });
});
