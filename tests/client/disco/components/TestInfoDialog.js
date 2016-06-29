import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { sprintf } from 'jed';

import {
  InfoDialog,
} from 'disco/components/InfoDialog';

import { getFakeI18nInst } from 'tests/client/helpers';


describe('<InfoDialog />', () => {
  let closeAction;

  function renderInfoDialog(props = {}) {
    closeAction = sinon.stub();
    const renderProps = {
      addonName: 'A Test Add-on',
      imageURL: 'https://addons-dev-cdn.allizom.org/whatever',
      closeAction,
      i18n: getFakeI18nInst(),
      ...props,
    };

    renderProps.i18n.sprintf = sprintf;

    return renderIntoDocument(
      <InfoDialog {...renderProps} />);
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
