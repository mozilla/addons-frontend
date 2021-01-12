import * as React from 'react';

import InfoDialog, { InfoDialogBase } from 'amo/components/InfoDialog';
import { closeInfoDialog, showInfoDialog } from 'amo/reducers/infoDialog';
import {
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = (props = {}) => {
    const allProps = {
      i18n: fakeI18n(),
      store: dispatchClientMetadata().store,
      ...props,
    };

    return shallowUntilTarget(<InfoDialog {...allProps} />, InfoDialogBase, {
      // This is needed because of `react-onclickoutside`, see:
      // https://github.com/mozilla/addons-frontend/issues/5879
      shallowOptions: { disableLifecycleMethods: true },
    });
  };

  const createInfoDialogData = (overrides = {}) => {
    return {
      addonName: 'some addon',
      imageURL: 'http://example.org/some-addon.png',
      ...overrides,
    };
  };

  const _showInfoDialog = ({ store, data = {} }) => {
    store.dispatch(showInfoDialog(createInfoDialogData(data)));
  };

  it('renders nothing by default', () => {
    const root = render();

    expect(root.find('.InfoDialog')).toHaveLength(0);
  });

  it('renders an InfoDialog when shown', () => {
    const { store } = dispatchClientMetadata();

    const data = createInfoDialogData({ addonName: 'a test add-on' });
    _showInfoDialog({ store, data });

    const root = render({ store });

    expect(root.find('.InfoDialog')).toHaveLength(1);
    expect(root.find('.InfoDialog')).toHaveProp('role', 'dialog');
    expect(root.find('.InfoDialog-title').html()).toContain(data.addonName);
    expect(root.find('.InfoDialog-description')).toIncludeText(
      'Manage your add-ons',
    );
    expect(root.find('.InfoDialog-logo').find('img')).toHaveProp(
      'src',
      data.imageURL,
    );
    expect(root.find('.InfoDialog-button')).toHaveLength(1);
    expect(root.find('.InfoDialog-button')).toHaveProp(
      'onClick',
      root.instance().closeInfoDialog,
    );
  });

  it('exposes a method for the react-onclickoutside HOC', () => {
    const root = render();

    expect(root.instance().handleClickOutside).toBeDefined();
  });

  it('dispatches closeInfoDialog when clicking the "OK" button', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    _showInfoDialog({ store });

    const root = render({ store });

    root.find('.InfoDialog-button').simulate('click');

    sinon.assert.calledWith(dispatchSpy, closeInfoDialog());
  });

  it('dispatches closeInfoDialog when clicking outside', () => {
    const { store } = dispatchClientMetadata();
    const dispatchSpy = sinon.spy(store, 'dispatch');

    const root = render({ store });

    // Simulate a user who clicks outside the InfoDialog component.
    root.instance().handleClickOutside();

    sinon.assert.calledWith(dispatchSpy, closeInfoDialog());
  });
});
