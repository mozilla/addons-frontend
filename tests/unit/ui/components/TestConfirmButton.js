import * as React from 'react';

import Button from 'ui/components/Button';
import ConfirmButton, { ConfirmButtonBase } from 'ui/components/ConfirmButton';
import {
  applyUIStateChanges,
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const render = ({ children, i18n = fakeI18n(), ...props } = {}) => {
    return shallowUntilTarget(
      <ConfirmButton
        i18n={i18n}
        message="some warning message"
        onConfirm={sinon.stub()}
        store={dispatchClientMetadata().store}
        {...props}
      >
        {children || 'the default text of this button'}
      </ConfirmButton>,
      ConfirmButtonBase,
    );
  };

  it('renders a button', () => {
    const root = render();

    expect(root).toHaveClassName('ConfirmButton');
    expect(root.find(Button)).toHaveLength(1);
    expect(root.find(Button)).toHaveClassName('ConfirmButton-default-button');
    expect(root.find(Button)).toHaveProp('buttonType', 'neutral');
  });

  it('passes the buttonType prop to the button', () => {
    const buttonType = 'alert';
    const root = render({ buttonType });

    expect(root.find(Button)).toHaveProp('buttonType', buttonType);
  });

  it('passes the children prop to the button', () => {
    const children = 'this is the text of the button shown by default';
    const root = render({ children });

    expect(root.find(Button).children()).toHaveText(children);
  });

  it('shows a confirmation panel when button is clicked', () => {
    const { store } = dispatchClientMetadata();
    const message = 'this action is risky, are you sure?';
    const root = render({ message, store });

    expect(root).not.toHaveClassName('ConfirmButton--show-confirmation');

    root.find(Button).simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root).toHaveClassName('ConfirmButton--show-confirmation');

    expect(root.find('.ConfirmButton-message')).toHaveLength(1);
    expect(root.find('.ConfirmButton-message')).toHaveText(message);

    expect(root.find(Button)).toHaveLength(2);

    const confirmButton = root.find(Button).at(0);
    expect(confirmButton).toHaveClassName('ConfirmButton-confirm-button');
    expect(confirmButton).toHaveProp('buttonType', 'alert');
    expect(confirmButton.children()).toHaveText('Confirm');

    const cancelButton = root.find(Button).at(1);
    expect(cancelButton).toHaveClassName('ConfirmButton-cancel-button');
    expect(cancelButton).toHaveProp('buttonType', 'cancel');
    expect(cancelButton.children()).toHaveText('Cancel');
  });

  it('passes props to the confirm button in the confirmation panel', () => {
    const { store } = dispatchClientMetadata();
    const confirmButtonText = 'neutral confirm button';
    const confirmButtonType = 'neutral';

    const root = render({ confirmButtonText, confirmButtonType, store });

    // Show the confirmation panel.
    root.find(Button).simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root.find('.ConfirmButton-confirm-button')).toHaveProp(
      'buttonType',
      confirmButtonType,
    );
    expect(root.find('.ConfirmButton-confirm-button').children()).toHaveText(
      confirmButtonText,
    );
  });

  it('closes the confirmation panel on cancel ', () => {
    const { store } = dispatchClientMetadata();
    const onConfirmSpy = sinon.spy();
    const root = render({ onConfirm: onConfirmSpy, store });

    expect(root).not.toHaveClassName('ConfirmButton--show-confirmation');

    // Show the confirmation panel.
    root.find(Button).simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root).toHaveClassName('ConfirmButton--show-confirmation');
    sinon.assert.notCalled(onConfirmSpy);

    root
      .find('.ConfirmButton-cancel-button')
      .simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root).not.toHaveClassName('ConfirmButton--show-confirmation');
    sinon.assert.notCalled(onConfirmSpy);
  });

  it('calls the onConfirm prop when user clicks the "confirm" button', () => {
    const { store } = dispatchClientMetadata();
    const onConfirmSpy = sinon.spy();
    const root = render({ onConfirm: onConfirmSpy, store });

    expect(root).not.toHaveClassName('ConfirmButton--show-confirmation');

    // Show the confirmation panel.
    root.find(Button).simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root).toHaveClassName('ConfirmButton--show-confirmation');
    sinon.assert.notCalled(onConfirmSpy);

    const event = createFakeEvent();
    root.find('.ConfirmButton-confirm-button').simulate('click', event);
    applyUIStateChanges({ root, store });

    expect(root).not.toHaveClassName('ConfirmButton--show-confirmation');
    sinon.assert.calledWith(onConfirmSpy, event);
  });

  it('changes UI state when the confirm button is clicked', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    expect(root.instance().props.uiState.showConfirmation).toEqual(false);

    root.find(Button).simulate('click', createFakeEvent());
    applyUIStateChanges({ root, store });

    expect(root.instance().props.uiState.showConfirmation).toEqual(true);
  });
});
